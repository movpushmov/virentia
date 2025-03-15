import { describe, expect, it } from "vitest";
import { createContext, createNode, run, scope } from "../lib";

describe("kernel", () => {
  it("executes a node chain with the value produced by the previous node", async () => {
    const appScope = scope();
    const calls: unknown[] = [];
    const second = createNode((ctx) => {
      calls.push(["second", ctx.payload, ctx.value]);
      return `${ctx.value}!`;
    });
    const first = createNode({
      run: (ctx) => {
        calls.push(["first", ctx.payload, ctx.value]);
        return "next";
      },
      next: [second],
    });

    await run({ unit: first, payload: "start", scope: appScope });

    expect(calls).toEqual([
      ["first", "start", "start"],
      ["second", "next", "next"],
    ]);
  });

  it("does not execute downstream nodes after a node stops", async () => {
    const appScope = scope();
    const calls: string[] = [];
    const downstream = createNode(() => {
      calls.push("downstream");
    });
    const source = createNode({
      run: (ctx) => {
        calls.push("source");
        ctx.stop();
        return "ignored";
      },
      next: [downstream],
    });

    await run({ unit: source, scope: appScope });

    expect(calls).toEqual(["source"]);
  });

  it("skips disabled nodes", async () => {
    const appScope = scope();
    const calls: string[] = [];
    const alwaysDisabled = createNode({
      enabled: false,
      run: () => {
        calls.push("always-disabled");
      },
    });
    const dynamicallyDisabled = createNode({
      enabled: () => false,
      run: () => {
        calls.push("dynamically-disabled");
      },
    });
    const enabled = createNode(() => {
      calls.push("enabled");
    });

    await run({
      unit: [alwaysDisabled, dynamicallyDisabled, enabled],
      scope: appScope,
    });

    expect(calls).toEqual(["enabled"]);
  });

  it("batches queued work by node and batch key and keeps the latest value", async () => {
    const appScope = scope();
    const values: unknown[] = [];
    const target = createNode((ctx) => {
      values.push(ctx.value);
    });
    const first = createNode({
      run: () => "first",
      next: [target],
    });
    const second = createNode({
      run: () => "second",
      next: [target],
    });

    await run({
      unit: [first, second],
      scope: appScope,
      batchKey: "same-target",
    });

    expect(values).toEqual(["second"]);
  });

  it("passes meta through the whole run chain", async () => {
    const appScope = scope();
    const seen: unknown[] = [];
    const second = createNode((ctx) => {
      seen.push(ctx.meta);
    });
    const first = createNode({
      run: (ctx) => {
        ctx.meta.trace = "updated";
        return "value";
      },
      next: [second],
    });
    const meta = { trace: "initial" };

    await run({ unit: first, scope: appScope, meta });

    expect(seen).toEqual([{ trace: "updated" }]);
  });

  it("keeps kernel contexts available across awaited node work", async () => {
    const appScope = scope();
    const requestContext = createContext<string>();
    const values: unknown[] = [];
    const downstream = createNode((ctx) => {
      values.push(["downstream", ctx.getContext(requestContext), ctx.value]);
    });
    const source = createNode({
      async run(ctx) {
        values.push(["before-await", ctx.getContext(requestContext)]);

        await Promise.resolve();

        values.push(["after-await", ctx.getContext(requestContext)]);
        ctx.setContext(requestContext, "updated");
        return "done";
      },
      next: [downstream],
    });

    await run({
      unit: source,
      scope: appScope,
      contexts: [requestContext.setup("initial")],
    });

    expect(values).toEqual([
      ["before-await", "initial"],
      ["after-await", "initial"],
      ["downstream", "updated", "done"],
    ]);
  });
});

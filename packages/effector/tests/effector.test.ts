import { describe, expect, it } from "vitest";
import {
  allSettled,
  attach,
  combine,
  createApi,
  createEffect,
  createEvent,
  createStore,
  fork,
  hydrate,
  is,
  restore,
  sample,
  scopeBind,
  serialize,
  split,
} from "../lib";

describe("@virentia/effector compatibility", () => {
  it("connects events and stores through store.on", async () => {
    const inc = createEvent<number>();
    const reset = createEvent();
    const $count = createStore(0)
      .on(inc, (count, amount) => count + amount)
      .reset(reset);
    const values: number[] = [];

    $count.watch((value) => {
      values.push(value);
    });

    inc(2);
    inc(3);
    reset();

    expect($count.getState()).toBe(0);
    expect(values).toEqual([0, 2, 5, 0]);
  });

  it("runs sample with source, clock, filter, fn, and target", async () => {
    const submitted = createEvent<number>();
    const target = createEvent<string>();
    const $enabled = createStore(true);
    const $prefix = createStore("#");
    const values: string[] = [];

    target.watch((value) => {
      values.push(value);
    });

    sample({
      source: { prefix: $prefix, enabled: $enabled },
      clock: submitted,
      filter: ({ enabled }) => enabled,
      fn: ({ prefix }, value) => `${prefix}${value}`,
      target,
    });

    submitted(1);
    $enabled.setState(false);
    submitted(2);

    expect(values).toEqual(["#1"]);
  });

  it("combines stores and updates derived state", () => {
    const firstNameChanged = createEvent<string>();
    const lastNameChanged = createEvent<string>();
    const $firstName = createStore("Ada").on(firstNameChanged, (_, value) => value);
    const $lastName = createStore("Lovelace").on(lastNameChanged, (_, value) => value);
    const $fullName = combine(
      { firstName: $firstName, lastName: $lastName },
      ({ firstName, lastName }) => `${firstName} ${lastName}`,
    );

    firstNameChanged("Grace");
    lastNameChanged("Hopper");

    expect($fullName.getState()).toBe("Grace Hopper");
  });

  it("isolates state with fork and allSettled", async () => {
    const inc = createEvent<number>();
    const $count = createStore(0).on(inc, (count, amount) => count + amount);
    const firstScope = fork();
    const secondScope = fork({ values: [[$count, 10]] });

    await allSettled(inc, { scope: firstScope, params: 2 });
    await allSettled(inc, { scope: secondScope, params: 5 });

    expect($count.getState()).toBe(0);
    expect(firstScope.getState($count)).toBe(2);
    expect(secondScope.getState($count)).toBe(15);
  });

  it("creates effects with use and exposes effect subunits", async () => {
    const fetchFx = createEffect<number, string>();
    const values: unknown[] = [];

    fetchFx.use(async (id) => `user:${id}`);
    fetchFx.doneData.watch((value) => {
      values.push(value);
    });

    const result = await fetchFx(1);

    expect(result).toBe("user:1");
    expect(values).toEqual(["user:1"]);
    expect(fetchFx.pending.getState()).toBe(false);
    expect(fetchFx.inFlight.getState()).toBe(0);
  });

  it("routes payloads with split", () => {
    const submitted = createEvent<number>();
    const routed = split(submitted, {
      even: (value) => value % 2 === 0,
      odd: (value) => value % 2 === 1,
    });
    const values: string[] = [];

    routed.even.watch((value) => {
      values.push(`even:${value}`);
    });
    routed.odd.watch((value) => {
      values.push(`odd:${value}`);
    });

    submitted(1);
    submitted(2);

    expect(values).toEqual(["odd:1", "even:2"]);
  });

  it("supports createApi and restore helpers", () => {
    const submitted = createEvent<string>();
    const $value = restore(submitted, "initial");
    const api = createApi($value, {
      upper: (value) => value.toUpperCase(),
      append: (value, suffix: string) => `${value}${suffix}`,
    });

    submitted("virentia");
    api.upper();
    api.append("!");

    expect($value.getState()).toBe("VIRENTIA!");
  });

  it("creates attached effects from source stores", async () => {
    const requestFx = createEffect<{ token: string; id: number }, string>();
    const $token = createStore("root", { sid: "attach-token" });
    const scopedRequestFx = attach({
      source: $token,
      effect: requestFx,
      mapParams: (id: number, token: string) => ({ token, id }),
    });
    const scope = fork({ values: { "attach-token": "scoped" } });

    requestFx.use(({ token, id }) => `${token}:${id}`);

    const result = await allSettled(scopedRequestFx, { scope, params: 7 });

    expect(result).toEqual({ status: "done", value: "scoped:7" });
    expect(await scopedRequestFx(1)).toBe("root:1");
  });

  it("serializes and hydrates scoped store values by sid", async () => {
    const inc = createEvent<number>();
    const $count = createStore(0, { sid: "serialize-count" }).on(
      inc,
      (count, amount) => count + amount,
    );
    const $name = createStore("Ada", { sid: "serialize-name" });
    const scope = fork();

    await allSettled(inc, { scope, params: 3 });
    hydrate(scope, { values: { "serialize-name": "Grace" } });

    expect(serialize(scope)).toEqual({
      "serialize-count": 3,
      "serialize-name": "Grace",
    });
    expect(serialize(scope, { ignore: [$name] })).toEqual({
      "serialize-count": 3,
    });

    const hydratedScope = fork();

    hydrate(hydratedScope, { values: serialize(scope) });

    expect(hydratedScope.getState($count)).toBe(3);
    expect(hydratedScope.getState($name)).toBe("Grace");
  });

  it("exposes scopeBind and is utilities", async () => {
    const add = createEvent<number>();
    const saveFx = createEffect<number, string>((value) => `saved:${value}`);
    const $count = createStore(0).on(add, (count, amount) => count + amount);
    const scope = fork();
    const boundAdd = scopeBind(add, { scope });

    await (boundAdd(5) as Promise<void>);

    expect(scope.getState($count)).toBe(5);
    expect(is.unit(add)).toBe(true);
    expect(is.event(add)).toBe(true);
    expect(is.store($count)).toBe(true);
    expect(is.effect(saveFx)).toBe(true);
    expect(is.targetable(add)).toBe(true);
    expect(is.targetable($count)).toBe(true);
    expect(is.targetable(saveFx)).toBe(true);
    expect(is.targetable(saveFx.pending)).toBe(false);
    expect(is.store(add)).toBe(false);
    expect(is.targetable({})).toBe(false);
  });
});

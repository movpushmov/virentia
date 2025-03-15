import { createNode } from "../kernel";
import type { Node } from "../kernel";
import { getActiveScope, setActiveScope } from "../scope/internal";
import type { Scope } from "../scope";
import { collectNodes } from "./deps";
import { registerCleanup } from "./owner";
import type { Effect } from "../units/effect";
import type { Event, EventCallable } from "../units/event";
import type { Store, StoreWritable } from "../units/store";

export interface Unit<_T = unknown> {
  readonly node: Node;
}

export type AnyUnit = Unit<unknown>;
export type UnitList<T> = Unit<T> | readonly Unit<T>[];

export type UnitInput<T> =
  T extends Store<infer Value>
    ? Value
    : T extends StoreWritable<infer Value>
      ? Value
      : T extends EventCallable<infer Payload>
        ? Payload
        : T extends Event<infer Payload>
          ? Payload
          : T extends Effect<infer Params, infer _Done, infer _Fail>
            ? Params
            : T extends Unit<infer Payload>
              ? Payload
              : never;

export type SourceInput<T> = T extends readonly (infer Item)[] ? UnitInput<Item> : UnitInput<T>;

export interface Reaction {
  readonly node: Node;
  readonly explicit: boolean;
  dependencies(): readonly Node[];
  stop(): void;
}

export interface ReactionConfig<On extends UnitList<unknown>> {
  on: On;
  run(payload: SourceInput<On>): void;
}

export interface AutoReactionConfig {
  run(): void;
}

export function reaction(run: () => void): Reaction;
export function reaction(config: AutoReactionConfig): Reaction;
export function reaction<On extends UnitList<unknown>>(config: ReactionConfig<On>): Reaction;
export function reaction<On extends UnitList<unknown>>(
  input: (() => void) | AutoReactionConfig | ReactionConfig<On>,
): Reaction {
  const explicit = typeof input === "object" && "on" in input;
  const runHandler = typeof input === "function" ? input : input.run;
  const currentDependencies = new Set<Node>();
  let stopped = false;

  const node = createNode((ctx) => {
    if (stopped) {
      return ctx.value;
    }

    if (explicit) {
      (runHandler as (payload: SourceInput<On>) => void)(ctx.value as SourceInput<On>);
    } else {
      runAuto();
    }

    return ctx.value;
  });

  const runAuto = (): void => {
    const activeScope = getActiveScope();
    const trackingScope = activeScope ? null : createTrackingScope();
    const previousScope = trackingScope ? setActiveScope(trackingScope) : null;

    try {
      const collected = collectNodes(() => {
        (runHandler as () => void)();
      });

      reconcileDependencies(node, currentDependencies, collected.nodes);
    } finally {
      if (trackingScope) {
        setActiveScope(previousScope);
      }
    }
  };

  if (explicit) {
    for (const source of asArray(input.on)) {
      attach(source.node, node);
      currentDependencies.add(source.node);
    }
  } else {
    runAuto();
  }

  const result: Reaction = {
    node,
    explicit,

    dependencies(): readonly Node[] {
      return [...currentDependencies];
    },

    stop(): void {
      stopped = true;

      for (const dependency of currentDependencies) {
        detach(dependency, node);
      }

      currentDependencies.clear();
    },
  };

  registerCleanup(() => {
    result.stop();
  });

  return result;
}

function reconcileDependencies(node: Node, current: Set<Node>, next: Set<Node>): void {
  for (const dependency of current) {
    if (!next.has(dependency)) {
      detach(dependency, node);
      current.delete(dependency);
    }
  }

  for (const dependency of next) {
    if (!current.has(dependency)) {
      attach(dependency, node);
      current.add(dependency);
    }
  }
}

function attach(source: Node, next: Node): void {
  source.next = source.next ?? [];

  if (!source.next.includes(next)) {
    source.next.push(next);
  }
}

function detach(source: Node, next: Node): void {
  if (!source.next) return;

  const index = source.next.indexOf(next);

  if (index >= 0) {
    source.next.splice(index, 1);
  }
}

function asArray<T>(value: UnitList<T>): readonly Unit<T>[] {
  return Array.isArray(value) ? value : [value as Unit<T>];
}

function createTrackingScope(): Scope {
  return {
    values: new Map(),
  };
}

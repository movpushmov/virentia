import * as core from "@virentia/core";
import { createEvent } from "./event";
import { isEffect } from "./guards";
import {
  computeCombined,
  defaultScope,
  launchTarget,
  passesFilter,
  readSource,
  sourceToClock,
  toArray,
} from "./shared";
import { createStore } from "./store";
import type {
  AnyUnit,
  Effect,
  Event,
  EventCallable,
  SourceShape,
  Store,
  StoreWritable,
  Unit,
  UnitTarget,
} from "./types";

export function sample(config: {
  clock?: AnyUnit | readonly AnyUnit[];
  source?: SourceShape;
  filter?: Store<boolean> | ((source: any, clock: any) => boolean);
  fn?: (source: any, clock: any) => any;
  target?: UnitTarget<any>;
}): AnyUnit {
  const target = config.target ?? createEvent();
  const clocks = toArray(config.clock ?? sourceToClock(config.source));

  for (const clock of clocks) {
    core.reaction({
      on: clock,
      run: (clockPayload: unknown) => {
        const sourceValue = config.source === undefined ? undefined : readSource(config.source);

        if (!passesFilter(config.filter, sourceValue, clockPayload)) {
          return;
        }

        const payload = config.fn
          ? config.source === undefined
            ? config.fn(clockPayload, clockPayload)
            : config.fn(sourceValue, clockPayload)
          : config.source === undefined
            ? clockPayload
            : sourceValue;

        launchTarget(target, payload);
      },
    });
  }

  return (Array.isArray(target) ? target[0] : target) as AnyUnit;
}

export function combine(shape: SourceShape, fn?: (value: any) => any): Store<any>;
export function combine(...args: any[]): Store<any>;
export function combine(...args: any[]): Store<any> {
  const fn = typeof args[args.length - 1] === "function" ? args.pop() : undefined;
  const shape = args.length === 1 ? args[0] : args;
  const result = createStore(computeCombined(shape, fn));

  core.scoped(defaultScope, () => {
    core.reaction(() => {
      result.setState(computeCombined(shape, fn));
    });
  });

  return result;
}

export function split<T>(
  source: Unit<T>,
  cases: Record<string, (payload: T) => boolean>,
): Record<string, Event<T>>;
export function split<T>(config: {
  source: Unit<T>;
  match: ((payload: T) => string) | Record<string, (payload: T) => boolean>;
  cases?: Record<string, Event<T>>;
}): Record<string, Event<T>>;
export function split<T>(
  sourceOrConfig:
    | Unit<T>
    | {
        source: Unit<T>;
        match: ((payload: T) => string) | Record<string, (payload: T) => boolean>;
        cases?: Record<string, Event<T>>;
      },
  maybeCases?: Record<string, (payload: T) => boolean>,
): Record<string, Event<T>> {
  const source = "source" in sourceOrConfig ? sourceOrConfig.source : sourceOrConfig;
  const match = "source" in sourceOrConfig ? sourceOrConfig.match : (maybeCases ?? {});
  const result: Record<string, EventCallable<T>> = {};

  if (typeof match === "function") {
    const configuredCases = "source" in sourceOrConfig ? (sourceOrConfig.cases ?? {}) : {};

    for (const key of Object.keys(configuredCases)) {
      result[key] = (configuredCases[key] as EventCallable<T>) ?? createEvent<T>();
    }
  } else {
    for (const key of Object.keys(match)) {
      result[key] = createEvent<T>();
    }
  }

  result.__ = createEvent<T>();

  core.reaction({
    on: source,
    run: (payload: T) => {
      const key =
        typeof match === "function"
          ? match(payload)
          : Object.keys(match).find((caseName) => match[caseName](payload));

      launchTarget(result[key ?? "__"] ?? result.__, payload);
    },
  });

  return result;
}

export function createApi<T, Shape extends Record<string, (state: T, payload: any) => T>>(
  store: StoreWritable<T>,
  reducers: Shape,
): {
  [Key in keyof Shape]: EventCallable<Parameters<Shape[Key]>[1]>;
} {
  const result = {} as {
    [Key in keyof Shape]: EventCallable<Parameters<Shape[Key]>[1]>;
  };

  for (const key of Object.keys(reducers) as Array<keyof Shape>) {
    const event = createEvent<Parameters<Shape[typeof key]>[1]>(String(key));
    store.on(event, reducers[key]);
    result[key] = event;
  }

  return result;
}

export function restore<T>(
  unit: Event<T> | Effect<any, T, any>,
  defaultState: T,
): StoreWritable<T> {
  const store = createStore(defaultState);
  const source = isEffect(unit) ? unit.doneData : unit;

  store.on(source, (_, payload) => payload);

  return store;
}

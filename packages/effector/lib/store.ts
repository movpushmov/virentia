import * as core from "@virentia/core";
import type { Store as CoreStore, StoreWritable as CoreStoreWritable } from "@virentia/core";
import { createEvent } from "./event";
import {
  defaultScope,
  inScope,
  markScopeChanged,
  nativeStoreKeys,
  registerStore,
  toArray,
} from "./shared";
import {
  unitKind,
  type Event,
  type EventState,
  type Scope,
  type Store,
  type StoreState,
  type StoreWritable,
  type Unit,
  type Unsubscribe,
} from "./types";

export function createStore<T>(
  defaultState: T,
  config?: { name?: string; sid?: string; skipVoid?: boolean },
): StoreWritable<T> {
  const box = core.store({ value: defaultState });
  const updates = createEvent<T>({ name: `${config?.name ?? "store"} updates` });
  const store = createStoreFromBox(box, updates, defaultState, config?.name, config?.sid);

  registerStore(store);

  box.subscribe((next, scope) => {
    markScopeChanged(scope, store.sid);

    void core.run({
      unit: (updates as EventState<T>).__core.node,
      payload: next.value,
      scope,
    });
  });

  return store;
}

export function createStoreFromBox<T>(
  box: CoreStoreWritable<{ value: T }>,
  updates: Event<T>,
  defaultState: T,
  name = "store",
  sid?: string,
): StoreWritable<T> {
  const result = {
    [unitKind]: "store" as const,
    __box: box,
    __core: updates,
    node: (updates as EventState<T>).__core.node,
    shortName: name,
    sid,
    defaultState,
    updates,
    getType: () => name,
    getState(scope?: Scope): T {
      return readBox(box, scope);
    },
    setState(value: T, scope?: Scope): void {
      writeBox(box, value, scope);
    },
    watch(fn: (payload: T) => void): Unsubscribe {
      fn(readBox(box));

      return box.subscribe((next) => {
        fn(next.value);
      });
    },
    map<Next>(fn: (state: T) => Next): Store<Next> {
      const mapped = createStore(fn(result.getState()));

      core.scoped(defaultScope, () => {
        core.reaction(() => {
          mapped.setState(fn(result.getState()));
        });
      });

      return mapped;
    },
    on<Payload>(
      trigger: Unit<Payload>,
      reducer: (state: T, payload: Payload) => T,
    ): StoreWritable<T> {
      core.reaction({
        on: trigger,
        run: (payload: Payload) => {
          result.setState(reducer(result.getState(), payload));
        },
      });

      return result;
    },
    reset(trigger: Unit<any> | readonly Unit<any>[]): StoreWritable<T> {
      for (const unit of toArray(trigger)) {
        core.reaction({
          on: unit,
          run: () => {
            result.setState(defaultState);
          },
        });
      }

      return result;
    },
  } satisfies StoreState<T>;

  return result;
}

export function wrapNativeStore<T>(store: CoreStore<T>, defaultState: T, name: string): Store<T> {
  const updates = createEvent<T>(`${name}.updates`);
  const result = {
    [unitKind]: "store" as const,
    __core: updates,
    node: (updates as EventState<T>).__core.node,
    shortName: name,
    defaultState,
    updates,
    getType: () => name,
    getState(scope?: Scope): T {
      return readNativeStore(store, scope);
    },
    watch(fn: (payload: T) => void): Unsubscribe {
      fn(readNativeStore(store));

      return store.subscribe((next) => {
        fn(next);
      });
    },
    map<Next>(fn: (state: T) => Next): Store<Next> {
      const mapped = createStore(fn(result.getState()));

      core.scoped(defaultScope, () => {
        core.reaction(() => {
          mapped.setState(fn(result.getState()));
        });
      });

      return mapped;
    },
    on(): Store<T> {
      throw new Error("Store is read-only");
    },
    reset(): Store<T> {
      throw new Error("Store is read-only");
    },
  };

  store.subscribe((next, scope) => {
    void core.run({
      unit: (updates as EventState<T>).__core.node,
      payload: next,
      scope,
    });
  });

  return result as Store<T>;
}

function readBox<T>(box: CoreStoreWritable<{ value: T }>, scope?: Scope): T {
  return inScope(scope, () => box.value);
}

function writeBox<T>(box: CoreStoreWritable<{ value: T }>, value: T, scope?: Scope): void {
  inScope(scope, () => {
    box.value = value;
  });
}

function readNativeStore<T>(store: CoreStore<T>, scope?: Scope): T {
  return inScope(scope, () => {
    const keys = Reflect.ownKeys(store).filter((key) => !nativeStoreKeys.has(key));

    if (keys.length === 1 && keys[0] === "value") {
      return Reflect.get(store, "value") as T;
    }

    return Object.fromEntries(keys.map((key) => [key, Reflect.get(store, key)])) as T;
  });
}

import * as core from "@virentia/core";
import type { Scope as CoreScope } from "@virentia/core";
import { isScopeError, isStore } from "./guards";
import type {
  AnyUnit,
  CompatScope,
  Effect,
  EventCallable,
  Scope,
  SourceShape,
  Store,
  StoreValues,
  StoreWritable,
  UnitTarget,
} from "./types";

export const defaultScope = core.scope();
export const compatScopes = new WeakMap<CoreScope, CompatScope>();
export const storesBySid = new Map<string, StoreWritable<any>>();
export const nativeStoreKeys = new Set<PropertyKey>([
  "node",
  "writable",
  "subscribe",
  "map",
  "filter",
  "filterMap",
]);

export function createCompatScope(scope: CoreScope): CompatScope {
  const existing = compatScopes.get(scope);

  if (existing) {
    return existing;
  }

  const compatScope = {
    __core: scope,
    __changedSids: new Set<string>(),
    getState<T>(store: Store<T>): T {
      return store.getState(this);
    },
  };

  compatScopes.set(scope, compatScope);
  return compatScope;
}

export function inScope<T>(scope: Scope | undefined, fn: () => T): T {
  if (scope) {
    return core.scoped(scope.__core, fn);
  }

  try {
    return fn();
  } catch (error) {
    if (!isScopeError(error)) {
      throw error;
    }

    return core.scoped(defaultScope, fn);
  }
}

export function callWithFallback<T extends (...args: any[]) => Promise<any>>(unit: T): T {
  return ((...args: Parameters<T>) => {
    try {
      return unit(...args).catch((error: unknown) => {
        if (!isScopeError(error)) {
          throw error;
        }

        return core.scoped(defaultScope, () => unit(...args));
      });
    } catch (error) {
      if (!isScopeError(error)) {
        throw error;
      }

      return core.scoped(defaultScope, () => unit(...args));
    }
  }) as T;
}

export function readSource(source: SourceShape): unknown {
  if (isStore(source)) {
    return source.getState();
  }

  if (Array.isArray(source)) {
    return source.map((store) => store.getState());
  }

  return Object.fromEntries(Object.entries(source).map(([key, store]) => [key, store.getState()]));
}

export function sourceToClock(source: SourceShape | undefined): AnyUnit | AnyUnit[] {
  if (!source) {
    throw new Error("sample: clock or source is required");
  }

  if (isStore(source)) {
    return source;
  }

  return Object.values(source);
}

export function passesFilter(
  filter: Store<boolean> | ((source: any, clock: any) => boolean) | undefined,
  source: unknown,
  clock: unknown,
): boolean {
  if (!filter) {
    return true;
  }

  if (isStore(filter)) {
    return filter.getState();
  }

  return (filter as (source: unknown, clock: unknown) => boolean)(source, clock);
}

export function launchTarget(target: UnitTarget<any>, payload: unknown): void {
  for (const unit of toArray(target)) {
    if (isStore(unit)) {
      unit.setState(payload);
    } else {
      void (unit as EventCallable<unknown> | Effect<unknown, unknown>)(payload);
    }
  }
}

export function computeCombined(shape: SourceShape, fn?: (value: any) => any): unknown {
  const value = readSource(shape);

  return fn ? fn(value) : value;
}

export function registerStore(store: StoreWritable<any>): void {
  if (store.sid) {
    storesBySid.set(store.sid, store);
  }
}

export function markScopeChanged(
  scope: CoreScope | null | undefined,
  sid: string | undefined,
): void {
  if (sid) {
    createCompatScope(scope ?? defaultScope).__changedSids.add(sid);
  }
}

export function applyStoreValues(scope: Scope, values: StoreValues): void {
  if (Array.isArray(values)) {
    for (const [store, value] of values) {
      store.setState(value, scope);
    }

    return;
  }

  if (values instanceof Map) {
    for (const [store, value] of values) {
      applyStoreValue(scope, store, value);
    }

    return;
  }

  for (const [sid, value] of Object.entries(values)) {
    applyStoreValue(scope, sid, value);
  }
}

export function getName(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }

  if (input && (typeof input === "object" || typeof input === "function") && "shortName" in input) {
    return String((input as { shortName?: string }).shortName ?? "unit");
  }

  if (input && (typeof input === "object" || typeof input === "function") && "name" in input) {
    return String((input as { name?: string }).name ?? "unit");
  }

  return "unit";
}

export function toArray<T>(value: T | readonly T[]): readonly T[] {
  return Array.isArray(value) ? (value as readonly T[]) : [value as T];
}

function applyStoreValue(
  scope: Scope,
  storeOrSid: StoreWritable<any> | string,
  value: unknown,
): void {
  if (typeof storeOrSid === "string") {
    storesBySid.get(storeOrSid)?.setState(value, scope);
    return;
  }

  storeOrSid.setState(value, scope);
}

import {
  unitKind,
  type AnyUnit,
  type Effect,
  type EffectState,
  type Event,
  type Scope,
  type Store,
  type StoreWritable,
  type UnitTargetable,
} from "./types";

export const is = {
  unit(value: unknown): value is AnyUnit {
    return isUnit(value);
  },
  event(value: unknown): value is Event<any> {
    return isEvent(value);
  },
  store(value: unknown): value is Store<any> {
    return isStore(value);
  },
  effect(value: unknown): value is Effect<any, any, any> {
    return isEffect(value);
  },
  targetable(value: unknown): value is UnitTargetable {
    return isTargetable(value);
  },
};

export function isUnit(value: unknown): value is AnyUnit {
  return Boolean(
    value && (typeof value === "object" || typeof value === "function") && unitKind in value,
  );
}

export function isEvent(value: unknown): value is Event<any> {
  return isUnit(value) && value[unitKind] === "event";
}

export function isStore(value: unknown): value is StoreWritable<any> {
  return isUnit(value) && value[unitKind] === "store";
}

export function isEffect(value: unknown): value is EffectState<any, any, any> {
  return isUnit(value) && value[unitKind] === "effect";
}

export function isTargetable(value: unknown): value is UnitTargetable {
  return (
    isEvent(value) || isEffect(value) || (isStore(value) && typeof value.setState === "function")
  );
}

export function isScope(value: unknown): value is Scope {
  return Boolean(value && typeof value === "object" && "__core" in value && !(unitKind in value));
}

export function isScopeError(error: unknown): boolean {
  return error instanceof Error && error.message === "Scope is required";
}

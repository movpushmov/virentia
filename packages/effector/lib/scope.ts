import * as core from "@virentia/core";
import type { EventPayload } from "@virentia/core";
import { isEffect, isScope, isStore } from "./guards";
import { hydrate } from "./persistence";
import { createCompatScope, defaultScope } from "./shared";
import type {
  AnyUnit,
  Effect,
  Event,
  EventCallable,
  EventState,
  Scope,
  StoreValues,
  StoreWritable,
} from "./types";

export function fork(config?: { values?: StoreValues }): Scope {
  const nextScope = createCompatScope(core.scope());

  if (config?.values) {
    hydrate(nextScope, { values: config.values });
  }

  return nextScope;
}

export async function allSettled<T>(
  unit: Event<T> | StoreWritable<T>,
  options?: { scope?: Scope; params?: T },
): Promise<void>;
export async function allSettled<Params, Done, Fail>(
  unit: Effect<Params, Done, Fail>,
  options?: { scope?: Scope; params?: Params },
): Promise<{ status: "done"; value: Done } | { status: "fail"; value: Fail }>;
export async function allSettled(
  unitOrScope: AnyUnit | Scope,
  options: { scope?: Scope; params?: unknown } = {},
): Promise<unknown> {
  if (isScope(unitOrScope)) {
    return;
  }

  const scope = options.scope ?? createCompatScope(defaultScope);
  const unit = unitOrScope;

  if (isStore(unit)) {
    unit.setState(options.params, scope);
    return;
  }

  if (isEffect(unit)) {
    try {
      const value = await core.scoped(scope.__core, () => unit(options.params));
      return { status: "done", value };
    } catch (value) {
      return { status: "fail", value };
    }
  }

  await core.allSettled((unit as EventState<unknown>).__core, {
    scope: scope.__core,
    payload: options.params,
  });
}

export function scopeBind<T>(
  unit: EventCallable<T> | Effect<T, any, any>,
  config?: { scope?: Scope },
): (...payload: EventPayload<T>) => unknown {
  const scope = config?.scope ?? createCompatScope(defaultScope);

  return (...payload: EventPayload<T>) => core.scoped(scope.__core, () => unit(...payload));
}

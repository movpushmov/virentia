import * as core from "@virentia/core";
import type { EventCallable as CoreEvent, EventPayload } from "@virentia/core";
import { sample } from "./operators";
import { callWithFallback } from "./shared";
import {
  unitKind,
  type Event,
  type EventCallable,
  type EventState,
  type Unsubscribe,
} from "./types";
import { watchUnit } from "./watch";

export function createEvent<T = void>(nameOrConfig?: string | { name?: string }): EventCallable<T> {
  const name = typeof nameOrConfig === "string" ? nameOrConfig : (nameOrConfig?.name ?? "unit");

  return wrapEvent(core.event<T>(), name);
}

export function wrapEvent<T>(
  event: CoreEvent<T> | core.Event<T>,
  name = "event",
): EventCallable<T> {
  const callable =
    typeof event === "function"
      ? event
      : (((...payload: EventPayload<T>) =>
          core.allSettled(event as core.Event<any>, {
            payload: payload[0] as core.UnitInput<core.Event<any>>,
          })) as CoreEvent<T>);
  const result = callWithFallback(callable as EventState<T>);

  Object.assign(result, {
    [unitKind]: "event" as const,
    __core: event,
    node: event.node,
    shortName: name,
    getType: () => name,
    watch(fn: (payload: T) => void): Unsubscribe {
      return watchUnit(result, fn);
    },
    map<Next>(fn: (payload: T) => Next): Event<Next> {
      return wrapEvent(event.map(fn));
    },
    filter(config: { fn(payload: T): boolean } | ((payload: T) => boolean)): Event<T> {
      const fn = typeof config === "function" ? config : config.fn;
      return wrapEvent(event.filter(fn));
    },
    filterMap<Next>(fn: (payload: T) => Next | undefined): Event<Next> {
      return wrapEvent(event.filterMap(fn));
    },
    prepend<Before>(fn: (payload: Before) => T): EventCallable<Before> {
      const prepended = createEvent<Before>();

      sample({
        clock: prepended,
        fn,
        target: result,
      });

      return prepended;
    },
  });

  return result;
}

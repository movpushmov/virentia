import * as core from "@virentia/core";
import type { EventPayload } from "@virentia/core";
import { createEvent, wrapEvent } from "./event";
import { sample } from "./operators";
import { callWithFallback, getName } from "./shared";
import { wrapNativeStore } from "./store";
import {
  unitKind,
  type Effect,
  type EffectState,
  type EventCallable,
  type Unsubscribe,
} from "./types";
import { watchUnit } from "./watch";

export function createEffect<Params = void, Done = void, Fail = Error>(
  handlerOrConfig?:
    | ((params: Params) => Done | PromiseLike<Done>)
    | { name?: string; handler?: (params: Params) => Done | PromiseLike<Done> },
): Effect<Params, Done, Fail> {
  let handler = typeof handlerOrConfig === "function" ? handlerOrConfig : handlerOrConfig?.handler;

  const effectName = getName(handlerOrConfig);
  const fx = core.effect<Params, Done, Fail>((params) => {
    if (!handler) {
      throw new Error("Effect handler is not defined");
    }

    return handler(params);
  });

  const result = callWithFallback(((...params: EventPayload<Params>) =>
    fx(...(params as any))) as EffectState<Params, Done, Fail>);

  Object.assign(result, {
    [unitKind]: "effect" as const,
    __core: fx,
    node: fx.node,
    shortName: effectName,
    getType: () => effectName,
    watch(fn: (payload: Params) => void): Unsubscribe {
      return watchUnit(wrapEvent(fx.started), fn);
    },
    done: wrapEvent(fx.done),
    fail: wrapEvent(fx.fail),
    finally: wrapEvent(fx.finally),
    doneData: wrapEvent(fx.doneData),
    failData: wrapEvent(fx.failData),
    pending: wrapNativeStore(fx.$pending, false, `${effectName}.pending`),
    inFlight: wrapNativeStore(fx.$inFlight, 0, `${effectName}.inFlight`),
    prepend<Before>(fn: (payload: Before) => Params): EventCallable<Before> {
      const prepended = createEvent<Before>();

      sample({
        clock: prepended,
        fn,
        target: result,
      });

      return prepended;
    },
  });

  const use = ((nextHandler: (params: Params) => Done | PromiseLike<Done>) => {
    handler = nextHandler;
    return result;
  }) as unknown as Effect<Params, Done, Fail>["use"];

  use.getCurrent = () => {
    if (!handler) {
      throw new Error("Effect handler is not defined");
    }

    return handler;
  };

  result.use = use;

  return result;
}

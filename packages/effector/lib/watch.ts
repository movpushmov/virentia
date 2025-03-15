import * as core from "@virentia/core";
import type { Unit, Unsubscribe } from "./types";

export function watchUnit<T>(unit: Unit<T>, fn: (payload: T) => void): Unsubscribe {
  const subscription = core.reaction({
    on: unit,
    run: fn,
  });

  return () => subscription.stop();
}

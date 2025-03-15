import { createEffect } from "./effect";
import { isEffect } from "./guards";
import { getName, readSource } from "./shared";
import type { Effect, SourceShape, SourceValue } from "./types";

export function attach<Params, Done, Fail>(config: {
  effect: Effect<Params, Done, Fail>;
  name?: string;
}): Effect<Params, Done, Fail>;
export function attach<Params, Done, Fail = Error>(config: {
  effect(params: Params): Done | PromiseLike<Done>;
  name?: string;
}): Effect<Params, Done, Fail>;
export function attach<Params, Done, Fail, AttachedParams>(config: {
  effect: Effect<Params, Done, Fail>;
  mapParams(params: AttachedParams): Params;
  name?: string;
}): Effect<AttachedParams, Done, Fail>;
export function attach<Source extends SourceShape, Params, Done, Fail>(config: {
  source: Source;
  effect: Effect<Params, Done, Fail>;
  name?: string;
}): Effect<Params, Done, Fail>;
export function attach<Source extends SourceShape, Params, Done, Fail, AttachedParams>(config: {
  source: Source;
  effect: Effect<Params, Done, Fail>;
  mapParams(params: AttachedParams, source: SourceValue<Source>): Params;
  name?: string;
}): Effect<AttachedParams, Done, Fail>;
export function attach<Source extends SourceShape, Params, Done, Fail = Error>(config: {
  source: Source;
  effect(source: SourceValue<Source>, params: Params): Done | PromiseLike<Done>;
  name?: string;
}): Effect<Params, Done, Fail>;
export function attach(config: {
  source?: SourceShape;
  effect: Effect<any, any, any> | ((source: any, params: any) => any) | ((params: any) => any);
  mapParams?: (params: any, source?: any) => any;
  name?: string;
}): Effect<any, any, any> {
  const effectName = config.name ?? getName(config.effect);

  return createEffect({
    name: effectName,
    handler: (params: any) => {
      const hasSource = config.source !== undefined;
      const sourceValue = hasSource ? readSource(config.source as SourceShape) : undefined;

      if (isEffect(config.effect)) {
        const nextParams = config.mapParams ? config.mapParams(params, sourceValue) : params;

        return config.effect.use.getCurrent()(nextParams);
      }

      return hasSource
        ? (config.effect as (source: any, params: any) => any)(sourceValue, params)
        : (config.effect as (params: any) => any)(params);
    },
  });
}

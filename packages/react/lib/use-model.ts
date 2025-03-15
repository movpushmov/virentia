import { event, owner, store, scoped, type Scope } from "@virentia/core";
import { useEffect, useMemo } from "react";
import { getOrCreateCachedInstance } from "./model-cache";
import { useProvidedScope } from "./scope";
import type {
  CacheOptions,
  ModelContext,
  ModelFactory,
  ModelInstance,
  ReactiveModel,
} from "./types";
import { useUnitWithScope } from "./use-unit";
import { isPlainObject, isUnitLike, useIsomorphicLayoutEffect, writeStore } from "./utils";

export function useModel<Model extends object>(model: Model): ReactiveModel<Model>;
export function useModel<Props, Model extends object>(
  factory: ModelFactory<Props, Model>,
  props: Props,
): ReactiveModel<Model>;
export function useModel<Props, Key, Model extends object>(
  factory: ModelFactory<Props, Model, Key>,
  props: Props,
  options: CacheOptions<Props, Key, Model>,
): ReactiveModel<Model>;
export function useModel(
  modelOrFactory: Record<PropertyKey, unknown> | ModelFactory<any, object, any>,
  props?: unknown,
  options?: CacheOptions<any, any, object>,
): unknown {
  const scope = useProvidedScope();

  if (typeof modelOrFactory !== "function") {
    return useReactiveModel(modelOrFactory, scope);
  }

  const instance = useModelInstance(modelOrFactory, props, scope, options);

  return useReactiveModel(instance.model, scope);
}

function useModelInstance<Props, Key, Model extends object>(
  factory: ModelFactory<Props, Model, Key>,
  props: Props,
  scope: Scope,
  options?: CacheOptions<Props, Key, Model>,
): ModelInstance<Props, Model, Key> {
  const cache = options?.cache;
  const key = options?.key;
  const cached = Boolean(cache);
  const instance = useMemo(() => {
    if (cache) {
      return getOrCreateCachedInstance(cache, scope, key as Key, () =>
        createModelInstance(factory, props, scope, key as Key),
      );
    }

    return createModelInstance(factory, props, scope, undefined as Key);
  }, [cache, key, scope]);

  useIsomorphicLayoutEffect(() => {
    writeStore(instance.props, props, scope);
  }, [instance, props, scope]);

  useEffect(() => {
    scoped(scope, () => {
      instance.mounts.value += 1;
      void instance.mounted();
    });

    return () => {
      scoped(scope, () => {
        instance.mounts.value = Math.max(0, instance.mounts.value - 1);
        void instance.unmounted();
      });

      if (!cached) {
        instance.dispose();
      }
    };
  }, [cached, instance, scope]);

  return instance;
}

function createModelInstance<Props, Key, Model extends object>(
  factory: ModelFactory<Props, Model, Key>,
  props: Props,
  scope: Scope,
  key: Key,
): ModelInstance<Props, Model, Key> {
  return owner((dispose, modelOwner) => {
    const propsStore = store(props);
    const mounted = event<void>();
    const unmounted = event<void>();
    const mounts = store(0);
    const context = {
      scope,
      owner: modelOwner,
      props: propsStore,
      mounted,
      unmounted,
      mounts,
      key,
    } satisfies ModelContext<Props, Key>;
    const model = scoped(scope, () => factory(context));

    return {
      ...context,
      model,
      dispose,
    };
  });
}

function useReactiveModel<Model extends object>(model: Model, scope: Scope): ReactiveModel<Model> {
  const result: Record<PropertyKey, unknown> = {};

  for (const key of Reflect.ownKeys(model)) {
    if (key === "dispose" || key === disposeSymbol) {
      continue;
    }

    result[key] = useModelValue(Reflect.get(model, key), scope);
  }

  return result as ReactiveModel<Model>;
}

const disposeSymbol =
  typeof Symbol.dispose === "symbol" ? Symbol.dispose : Symbol.for("Symbol.dispose");

function useModelValue(value: unknown, scope: Scope): unknown {
  if (isUnitLike(value)) {
    return useUnitWithScope(value, scope);
  }

  if (isPlainObject(value)) {
    return useReactiveModel(value, scope);
  }

  return value;
}

import { applyStoreValues, createCompatScope, storesBySid } from "./shared";
import type { Scope, Store, StoreValues } from "./types";

export function serialize(
  scope: Scope,
  config: {
    onlyChanges?: boolean;
    ignore?: readonly (Store<any> | string)[];
  } = {},
): Record<string, unknown> {
  const compatScope = createCompatScope(scope.__core);
  const onlyChanges = config.onlyChanges ?? true;
  const ignored = new Set(
    (config.ignore ?? [])
      .map((item) => (typeof item === "string" ? item : item.sid))
      .filter((sid): sid is string => typeof sid === "string"),
  );
  const result: Record<string, unknown> = {};

  for (const [sid, store] of storesBySid) {
    if (ignored.has(sid)) {
      continue;
    }

    if (onlyChanges && !compatScope.__changedSids.has(sid)) {
      continue;
    }

    result[sid] = store.getState(compatScope);
  }

  return result;
}

export function hydrate(scope: Scope, config: { values: StoreValues }): void {
  applyStoreValues(scope, config.values);
}

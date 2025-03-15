import { run } from "../kernel";
import type { Node } from "../kernel";
import type { Scope } from "../scope";
import { getActiveScope } from "../scope/internal";
import type { AnyUnit, UnitInput } from "./reaction";

export interface AllSettledOptions<T> {
  scope?: Scope | null;
  payload?: T;
  batchKey?: PropertyKey;
  meta?: Record<string, unknown>;
}

export type SettledUnit = AnyUnit | Node;

export function allSettled<Unit extends SettledUnit>(
  unit: Unit,
  options: AllSettledOptions<UnitPayload<Unit>> = {},
): Promise<void> {
  const scope = options.scope ?? getActiveScope();

  if (!scope) {
    throw new Error("Scope is required");
  }

  return run({
    unit: getNode(unit),
    payload: options.payload,
    scope,
    batchKey: options.batchKey,
    meta: options.meta,
  });
}

type UnitPayload<Unit> = Unit extends Node ? unknown : UnitInput<Unit>;

function getNode(unit: SettledUnit): Node {
  return isUnit(unit) ? unit.node : unit;
}

function isUnit(value: SettledUnit): value is AnyUnit {
  return "node" in value;
}

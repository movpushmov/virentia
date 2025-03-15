import type { KernelContext, Node } from "./types";
import type { Scope } from "../scope";

export interface Page {
  id: number;
  parent: Page | null;
  contextMap: Map<symbol, unknown>;
}

export interface KernelWorkItem {
  node: Node;
  page: Page;
  scope: Scope | null;
  payload: unknown;
  value: unknown;
  error: unknown;
  failed: boolean;
  batchKey?: PropertyKey;
  queueKey?: string;
  meta: Record<string, unknown>;
}

export interface CreatePageOptions {
  parent?: Page | null;
  contexts?: Iterable<KernelContext>;
}

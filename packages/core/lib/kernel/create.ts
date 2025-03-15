import type { KernelNodeFn, Node } from "./types";

export type CreateNodeOptions = Node;

export function createNode(run?: KernelNodeFn): Node;
export function createNode(options?: CreateNodeOptions): Node;
export function createNode(input: KernelNodeFn | CreateNodeOptions = {}): Node {
  return typeof input === "function" ? { run: input } : { ...input };
}

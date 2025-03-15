import type { Node } from "../kernel";

type Collector = (node: Node) => void;

let collector: Collector | null = null;

export function trackNode(node: Node): void {
  collector?.(node);
}

export function collectNodes<T>(fn: () => T): { result: T; nodes: Set<Node> } {
  const previousCollector = collector;
  const nodes = new Set<Node>();

  collector = (node) => {
    nodes.add(node);
  };

  try {
    return {
      result: fn(),
      nodes,
    };
  } finally {
    collector = previousCollector;
  }
}

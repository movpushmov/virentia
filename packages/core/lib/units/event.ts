import { createNode, run } from "../kernel";
import type { Node } from "../kernel";
import { requireActiveScope } from "../scope/internal";
import { registerCleanup } from "../graph/owner";

export type EventPayload<T> = undefined extends T ? [payload?: T] : [payload: T];

export interface Event<T = void> {
  readonly node: Node;
  map<Next>(fn: (value: T) => Next): Event<Next>;
  filter(fn: (value: T) => boolean): Event<T>;
  filterMap<Next>(fn: (value: T) => Next | undefined): Event<Next>;
}

export interface EventCallable<T = void> extends Event<T> {
  (...payload: EventPayload<T>): Promise<void>;
}

export function event<T = void>(): EventCallable<T> {
  return createEvent<T>() as EventCallable<T>;
}

function createEvent<T>(): Event<T> {
  const node = createNode();

  const append = (next: Node): void => {
    node.next = node.next ?? [];
    node.next.push(next);

    registerCleanup(() => {
      const nextNodes = node.next;
      if (!nextNodes) return;

      const index = nextNodes.indexOf(next);

      if (index >= 0) {
        nextNodes.splice(index, 1);
      }
    });
  };

  const result = Object.assign(
    (...payload: EventPayload<T>) =>
      run({
        unit: node,
        payload: payload[0],
        scope: requireActiveScope(),
      }),
    {
      node,

      map<Next>(fn: (value: T) => Next): Event<Next> {
        const mapped = createEvent<Next>();

        append(
          createNode({
            run: (ctx) => fn(ctx.value as T),
            next: [mapped.node],
          }),
        );

        return mapped;
      },

      filter(fn: (value: T) => boolean): Event<T> {
        const filtered = createEvent<T>();

        append(
          createNode({
            run: (ctx) => {
              if (!fn(ctx.value as T)) {
                ctx.stop();
              }

              return ctx.value;
            },
            next: [filtered.node],
          }),
        );

        return filtered;
      },

      filterMap<Next>(fn: (value: T) => Next | undefined): Event<Next> {
        const mapped = createEvent<Next>();

        append(
          createNode({
            run: (ctx) => {
              const value = fn(ctx.value as T);

              if (value === undefined) {
                ctx.stop();
              }

              return value;
            },
            next: [mapped.node],
          }),
        );

        return mapped;
      },
    },
  );

  return result as Event<T>;
}

# Effector Bridge

`@virentia/effector` keeps an Effector-like surface on top of Virentia core.

Use it when a model already has this shape:

```ts
const incremented = createEvent<number>();
const $count = createStore(0).on(incremented, (count, amount) => count + amount);
```

## Import Change

```diff
-import { createEvent, createStore } from "effector";
+import { createEvent, createStore } from "@virentia/effector";
```

## Counter

```ts
import { allSettled, createEvent, createStore, fork } from "@virentia/effector";

const incremented = createEvent<number>();
const $count = createStore(0).on(incremented, (count, amount) => count + amount);
const appScope = fork();

await allSettled(incremented, {
  scope: appScope,
  params: 2,
});

console.log(appScope.getState($count)); // 2
```

## Main Differences

The bridge keeps Effector-shaped names around Virentia core primitives. `createEvent`, `createStore`, and `createEffect` map to core events, stores, and effects. `fork` creates a scope. `allSettled` uses `params`, while core `allSettled` uses `payload`.

The bridge is for Effector-shaped code. Core docs use core names.

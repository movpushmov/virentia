# Migration Notes

## Effector API Shape

```diff
-import { createEvent, createStore } from "effector";
+import { createEvent, createStore } from "@virentia/effector";
```

## One Model In Core

```diff
-const incremented = createEvent<number>();
-const $count = createStore(0).on(incremented, (count, amount) => count + amount);
+const incremented = event<number>();
+const count = store(0);
+
+reaction({
+  on: incremented,
+  run(amount) {
+    count.value += amount;
+  },
+});
```

## Boundary Difference

Core:

```ts
await allSettled(incremented, {
  scope,
  payload: 1,
});
```

Effector bridge:

```ts
await allSettled(incremented, {
  scope,
  params: 1,
});
```

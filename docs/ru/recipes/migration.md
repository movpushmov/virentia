# Миграция

## Сохранение формы Effector API

```diff
-import { createEvent, createStore } from "effector";
+import { createEvent, createStore } from "@virentia/effector";
```

## Перенос одной модели в ядро

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

## Разница на границе запуска

Ядро:

```ts
await allSettled(incremented, {
  scope,
  payload: 1,
});
```

Слой совместимости Effector:

```ts
await allSettled(incremented, {
  scope,
  params: 1,
});
```

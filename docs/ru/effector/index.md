# Совместимость с effector

`@virentia/effector` дает API в стиле Effector поверх ядра Virentia.

Используйте его, когда модель уже написана в таком стиле:

```ts
const incremented = createEvent<number>();
const $count = createStore(0).on(incremented, (count, amount) => count + amount);
```

## Замена import

```diff
-import { createEvent, createStore } from "effector";
+import { createEvent, createStore } from "@virentia/effector";
```

## Счетчик

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

## Главные отличия

Слой совместимости сохраняет привычные Effector-имена вокруг примитивов Virentia. `createEvent`, `createStore` и `createEffect` мапятся на события, сторы и эффекты ядра. `fork` создает scope. `allSettled` использует `params`, а `allSettled` ядра использует `payload`.

Слой совместимости нужен для кода в Effector-стиле. Документация ядра использует имена ядра.

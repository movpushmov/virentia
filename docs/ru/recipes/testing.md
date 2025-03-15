# Тестирование

Создавайте новый scope для каждого теста.

## Ядро

```ts
import { describe, expect, it } from "vitest";
import { allSettled, event, reaction, scope, store, scoped } from "@virentia/core";

describe("counter", () => {
  it("increments", async () => {
    const testScope = scope();
    const incremented = event<number>();
    const count = store(0);

    reaction({
      on: incremented,
      run(amount) {
        count.value += amount;
      },
    });

    await allSettled(incremented, {
      scope: testScope,
      payload: 2,
    });

    scoped(testScope, () => {
      expect(count.value).toBe(2);
    });
  });
});
```

## Слой совместимости Effector

```ts
import { allSettled, createEvent, createStore, fork } from "@virentia/effector";

const incremented = createEvent<number>();
const $count = createStore(0).on(incremented, (count, amount) => count + amount);
const testScope = fork();

await allSettled(incremented, {
  scope: testScope,
  params: 2,
});

expect(testScope.getState($count)).toBe(2);
```

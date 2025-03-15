# Counter

## Model

```ts
import { event, reaction, store } from "@virentia/core";

export function createCounterModel() {
  const incremented = event<number>();
  const reset = event<void>();
  const count = store(0);

  reaction({
    on: incremented,
    run(amount) {
      count.value += amount;
    },
  });

  reaction({
    on: reset,
    run() {
      count.value = 0;
    },
  });

  return { count, incremented, reset };
}
```

## Running Without UI

```ts
const appScope = scope();
const counter = createCounterModel();

await allSettled(counter.incremented, {
  scope: appScope,
  payload: 5,
});

scoped(appScope, () => {
  console.log(counter.count.value); // 5
});
```

## Render With React

```tsx
export const Counter = component({
  model: createCounterModel,
  view({ model }) {
    return <button onClick={() => model.incremented(1)}>{model.count}</button>;
  },
});
```

# Async Search

This recipe keeps query text, loading state, result state, and async search logic in one model.

## Model

```ts
import { effect, event, reaction, store } from "@virentia/core";

const queryChanged = event<string>();
const submitted = event<void>();

const query = store("");
const status = store<"idle" | "loading" | "ready" | "failed">("idle");
const results = store({ items: [] as string[] });

const searchFx = effect(async (text: string) => {
  const response = await fetch(`/api/search?q=${encodeURIComponent(text)}`);
  return (await response.json()) as string[];
});
```

## Wiring

```ts
reaction({
  on: queryChanged,
  run(text) {
    query.value = text;
  },
});

reaction({
  on: submitted,
  run() {
    void searchFx(query.value);
  },
});

reaction({
  on: searchFx.started,
  run() {
    status.value = "loading";
  },
});

reaction({
  on: searchFx.doneData,
  run(items) {
    results.items = items;
    status.value = "ready";
  },
});

reaction({
  on: searchFx.failData,
  run() {
    status.value = "failed";
  },
});
```

## Running

```ts
const appScope = scope();

await allSettled(queryChanged, {
  scope: appScope,
  payload: "virentia",
});
await allSettled(submitted, { scope: appScope });

scoped(appScope, () => {
  console.log(status.value); // ready
  console.log(results.items); // ["virentia:first", "virentia:second"]
});
```

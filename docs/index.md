---
layout: home

hero:
  name: Virentia
  text: State manager for complex business logic
  tagline: Describe application rules outside the UI and run the same model wherever it is needed.
  image:
    src: /logo.svg
    alt: Virentia logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Core
      link: /core/

features:
  - title: Business rules in the model
    details: Events describe what happened. Stores hold state. Effects run external work. Reactions connect behavior.
  - title: Scoped values
    details: Reuse the same model in an app, request, test, tab, or preview without sharing state.
  - title: Runtime models
    details: Create state when a runtime scenario starts and dispose its subscriptions when it ends.
  - title: UI adapters
    details: Keep domain models in core and render them through framework bindings.
---

<CodeRow>
<template #left>

```ts
import { event, reaction, store } from "@virentia/core";

export function createCounterModel() {
  const incremented = event<void>();
  const count = store(0);

  reaction({
    on: incremented,
    run() {
      count.value += 1;
    },
  });

  return { count, incremented };
}
```

</template>

<template #right>

```tsx
import { component } from "@virentia/react";
import { createCounterModel } from "./model";

export const Counter = component({
  model: createCounterModel,
  view({ model }) {
    const increment = () => model.incremented();

    return <button onClick={increment}>{model.count}</button>;
  },
});
```

</template>
</CodeRow>

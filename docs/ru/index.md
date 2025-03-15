---
layout: home

hero:
  name: Virentia
  text: Стейт-менеджер для сложной бизнес-логики
  tagline: "Описывайте бизнес-правила как модель: состояние в сторах, события для фактов, эффекты для внешней работы, реакции для правил."
  image:
    src: /logo.svg
    alt: Логотип Virentia
  actions:
    - theme: brand
      text: Начать
      link: /ru/guide/getting-started
    - theme: alt
      text: Ядро
      link: /ru/core/

features:
  - title: Бизнес-правила в модели
    details: События описывают, что произошло, сторы хранят состояние, эффекты запускают внешнюю работу, реакции связывают поведение.
  - title: Изолированное состояние
    details: Одна модель может работать в приложении, запросе, тесте, вкладке или предпросмотре без общего состояния.
  - title: Динамические модели
    details: Создавайте состояние, когда открывается экран или виджет, и очищайте подписки, когда он больше не нужен.
  - title: UI-адаптеры
    details: Пишите доменную логику отдельно от интерфейса и подключайте ее через нужный UI-слой.
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

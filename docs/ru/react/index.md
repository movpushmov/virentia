# React

`@virentia/react` подключает модели ядра к React-компонентам.

Доменную логику держите в `@virentia/core`, а к React подключайте через этот пакет.

## Передача scope

`ScopeProvider` передает scope в React-дерево.

```tsx
import { scope } from "@virentia/core";
import { ScopeProvider } from "@virentia/react";

const appScope = scope();

export function App() {
  return (
    <ScopeProvider scope={appScope}>
      <Routes />
    </ScopeProvider>
  );
}
```

## Чтение стора

```tsx
const count = useUnit(model.count);
```

## Вызов события

```tsx
const incremented = useUnit(model.incremented);

return <button onClick={() => incremented(1)}>{count}</button>;
```

## Использование модели

```tsx
const viewModel = useModel(model);
```

Сторы становятся значениями. События и эффекты становятся функциями для вызова.

```tsx
return <button onClick={() => viewModel.incremented(1)}>{viewModel.count}</button>;
```

## Быстрый вариант через component

`component` создает модель из props и передает в `view` уже подготовленный для рендера вариант.

```tsx
export const Counter = component({
  model: createCounterModel,
  view({ model }) {
    return <button onClick={() => model.incremented(1)}>{model.count}</button>;
  },
});
```

## Страницы React

- [useUnit](/ru/react/use-unit)
- [Модели и компоненты](/ru/react/models)
- [Кешированные модели](/ru/react/cache)

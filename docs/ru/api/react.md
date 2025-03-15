# @virentia/react API

Используйте `@virentia/react` на границе рендеринга. Доменную логику держите в моделях `@virentia/core`.

## ScopeProvider

Передает scope из ядра в React hooks.

Используйте `ScopeProvider` один раз на React-дерево, которое должно разделять состояние. Вложенные деревья могут предоставить другой scope, если им нужна изоляция.

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

## useProvidedScope

Читает scope из ближайшего `ScopeProvider`.

Используйте этот hook, когда компонент должен передать scope в helpers на границе запуска, кеши или внешние адаптеры.

```tsx
function SaveButton({ saved }: { saved: EventCallable<void> }) {
  const scope = useProvidedScope();
  const onClick = () => allSettled(saved, { scope });

  return <button onClick={onClick}>Save</button>;
}
```

Если `ScopeProvider` отсутствует, hook бросит ошибку.

## useUnit

Читает сторы и привязывает вызываемые юниты к scope из `ScopeProvider`.

Используйте `useUnit` для простых компонентов, которым нужно несколько сторов, событий или эффектов.

```tsx
const countValue = useUnit(count);
const increment = useUnit(incremented);
```

Объект:

```tsx
const model = useUnit({
  count,
  incremented,
  pending: saveFx.$pending,
  save: saveFx,
});
```

Массив:

```tsx
const [countValue, increment] = useUnit([count, incremented]);
```

## useModel

Подготавливает модель для рендера.

Используйте `useModel`, когда компонент работает с целой моделью и хочет видеть сторы как значения, а события и эффекты как функции для вызова.

```tsx
const model = useModel({
  count,
  incremented,
});
```

Создание модели из props:

```tsx
function createCounterModel({ props }: ModelContext<{ step: number }>) {
  const clicked = event<void>();
  const count = store(0);

  reaction({
    on: clicked,
    run() {
      count.value += props.step;
    },
  });

  return { clicked, count };
}

function Counter(props: { step: number }) {
  const model = useModel(createCounterModel, props);
  const increment = () => model.clicked();

  return <button onClick={increment}>{model.count}</button>;
}
```

Используйте кеш, когда модель должна пережить размонтирование компонента:

```tsx
const model = useModel(createChatModel, props, {
  cache: chatCache,
  key: props.chatId,
});
```

## component

Соединяет фабрику модели и view.

Используйте `component`, когда модель принадлежит жизненному циклу компонента. Так создание модели, props, события монтирования и размонтирования, а также рендер остаются в одном понятном паттерне.

```tsx
export const Counter = component({
  model({ props }: ModelContext<{ step: number }>) {
    const clicked = event<void>();
    const count = store(0);

    reaction({
      on: clicked,
      run() {
        count.value += props.step;
      },
    });

    return { clicked, count };
  },
  view({ model }) {
    const increment = () => model.clicked();

    return <button onClick={increment}>{model.count}</button>;
  },
});
```

Кешированный компонент:

```tsx
export const ChatPanel = component({
  cache: chatCache,
  key: (props: { chatId: string }) => props.chatId,
  model: createChatModel,
  view({ model }) {
    return <div>{model.messages.items.length}</div>;
  },
});
```

## createModelCache

Создает кеш, который учитывает scope и ваш key.

Используйте `createModelCache`, когда модель должна пережить размонтирование и позже переиспользоваться по key: чаты, вкладки, экраны деталей, медиаплееры, предпросмотры.

```ts
const chatCache = createModelCache<string, ChatProps, ChatModel>();
```

Чтение кешированных моделей:

```ts
chatCache.has("support", appScope);
chatCache.get("support", appScope);
chatCache.getInstance("support", appScope);
```

Очистка кешированных моделей:

```ts
chatCache.delete("support", appScope);
chatCache.clear(appScope);
```

## ModelContext

Фабрики моделей получают context.

Используйте его, когда логика модели зависит от props, жизненного цикла, текущего scope или ключа кеша.

```ts
interface ModelContext<Props, Key = undefined> {
  readonly scope: Scope;
  readonly owner: Owner;
  readonly props: StoreWritable<Props>;
  readonly mounted: EventCallable<void>;
  readonly unmounted: EventCallable<void>;
  readonly mounts: StoreWritable<number>;
  readonly key: Key;
}
```

`mounted`, `unmounted` и `mounts` полезны для логики жизненного цикла внутри модели.

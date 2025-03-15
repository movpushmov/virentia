# @virentia/react API

Use `@virentia/react` at the rendering boundary. Keep domain logic in `@virentia/core` models.

## ScopeProvider

Provides a core scope to hooks.

Use it once per React tree that should share state. Nested trees can provide another scope when they need isolation.

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

Reads the provided scope.

Use it when a component needs to pass the scope into boundary helpers such as `allSettled`, caches, or external adapters.

```tsx
function SaveButton({ saved }: { saved: EventCallable<void> }) {
  const scope = useProvidedScope();
  const onClick = () => allSettled(saved, { scope });

  return <button onClick={onClick}>Save</button>;
}
```

It throws when there is no `ScopeProvider`.

## useUnit

Reads stores and binds callable units to the provided scope.

Use it for simple components that only need a few stores, events, or effects.

```tsx
const countValue = useUnit(count);
const increment = useUnit(incremented);
```

Object shape:

```tsx
const model = useUnit({
  count,
  incremented,
  pending: saveFx.$pending,
  save: saveFx,
});
```

Array shape:

```tsx
const [countValue, increment] = useUnit([count, incremented]);
```

## useModel

Unwraps a model object.

Use it when a component works with a whole model and wants stores as values and events/effects as callbacks.

```tsx
const model = useModel({
  count,
  incremented,
});
```

Creates a model from props:

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

Use a cache when the model should survive unmount:

```tsx
const model = useModel(createChatModel, props, {
  cache: chatCache,
  key: props.chatId,
});
```

## component

Pairs a model factory and a view.

Use it when the model belongs to the component lifecycle. It keeps creation, props, mount events, unmount events, and rendering in one pattern.

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

Cached component:

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

Creates a scope-aware cache keyed by your ID.

Use it when a model should survive unmount and be reused later by key: chats, tabs, detail screens, media players, previews.

```ts
const chatCache = createModelCache<string, ChatProps, ChatModel>();
```

Read cached models:

```ts
chatCache.has("support", appScope);
chatCache.get("support", appScope);
chatCache.getInstance("support", appScope);
```

Dispose cached models:

```ts
chatCache.delete("support", appScope);
chatCache.clear(appScope);
```

## ModelContext

Model factories receive:

Use this context when model logic depends on props, lifecycle, the current scope, or a cache key.

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

Use `mounted`, `unmounted`, and `mounts` for lifecycle logic inside the model.

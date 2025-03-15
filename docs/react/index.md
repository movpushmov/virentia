# React

`@virentia/react` connects core models to React components.

Keep state logic in `@virentia/core`. Use this package at the rendering boundary.

## Scope Provider

`ScopeProvider` is the React boundary for a scope.

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

## Store Reading

```tsx
const count = useUnit(model.count);
```

## Event Calls

```tsx
const incremented = useUnit(model.incremented);

return <button onClick={() => incremented(1)}>{count}</button>;
```

## Model Usage

```tsx
const viewModel = useModel(model);
```

Stores become values. Events and effects become callbacks.

```tsx
return <button onClick={() => viewModel.incremented(1)}>{viewModel.count}</button>;
```

## Component Shortcut

`component` creates a model from props and passes the unwrapped model to `view`.

```tsx
export const Counter = component({
  model: createCounterModel,
  view({ model }) {
    return <button onClick={() => model.incremented(1)}>{model.count}</button>;
  },
});
```

## React Pages

- [useUnit](/react/use-unit)
- [Models and component](/react/models)
- [Cached Models](/react/cache)

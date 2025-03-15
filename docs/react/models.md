# Models and component

React components often need state that depends on props and disappears with the component. In Virentia that state should still be a core model. The React package only creates it at the right time and prepares it for rendering.

## Model Factories

A model factory receives `ModelContext`. Its `props` field is a store, so reactions can read the latest props without recreating the model on every render.

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
```

Use a factory when the model belongs to one component instance, depends on props, or needs lifecycle units such as `mounted` and `unmounted`.

## useModel

`useModel` creates the model once for the component instance and unwraps it for rendering. Stores become values. Events and effects become callbacks bound to the provided scope.

```tsx
export function Counter(props: { step: number }) {
  const model = useModel(createCounterModel, props);

  return <button onClick={() => model.clicked()}>{model.count}</button>;
}
```

When the component unmounts, work created by the factory is disposed unless the model was placed in a cache.

## component

`component` is the same pattern packaged as one declaration: create the model, keep props fresh, send mount/unmount events, unwrap the model, and render the view.

```tsx
export const Counter = component({
  model: createCounterModel,
  view({ model }) {
    return <button onClick={() => model.clicked()}>{model.count}</button>;
  },
});
```

Use `component` when the model is owned by the view. Use `useModel` when you need to compose it manually inside an existing component.

## Lifecycle Units

Factories receive `mounted`, `unmounted`, and `mounts`. Use them for model logic that should react to the UI lifetime: loading data on mount, pausing work when the last instance unmounts, or tracking how many mounted views share a cached model.

Lifecycle units are part of the model, not React effects disguised as model code. Prefer them when the result should be testable as part of the model.

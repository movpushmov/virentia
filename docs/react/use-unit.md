# useUnit

`useUnit` reads stores and binds callable units to the provided scope.

## Single Store

```tsx
const count = useUnit(counter.count);
```

The component re-renders when that store changes in the provided scope.

## Single Event

```tsx
const incremented = useUnit(counter.incremented);
```

The returned function is bound to the provided scope.

```tsx
return <button onClick={() => incremented(1)}>{count}</button>;
```

## Object Shape

Use this when a component needs several units.

```tsx
const model = useUnit({
  count: counter.count,
  incremented: counter.incremented,
  reset: counter.reset,
});
```

```tsx
return <button onClick={() => model.incremented(1)}>{model.count}</button>;
```

## Effects

Effects become callbacks too.

```tsx
const form = useUnit({
  save: saveFx,
  pending: saveFx.$pending,
});

return (
  <button disabled={form.pending} onClick={() => form.save(values)}>
    Save
  </button>
);
```

# useUnit

`useUnit` читает сторы и привязывает вызываемые юниты к scope из `ScopeProvider`.

## Один стор

```tsx
const count = useUnit(counter.count);
```

Компонент перерендерится, когда этот стор изменится в текущем scope.

## Одно событие

```tsx
const incremented = useUnit(counter.incremented);
```

Возвращенная функция уже привязана к текущему scope.

```tsx
return <button onClick={() => incremented(1)}>{count}</button>;
```

## Объект

Передайте объект, когда компоненту нужны сразу несколько юнитов.

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

## Эффекты

Эффекты тоже становятся функциями для вызова.

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

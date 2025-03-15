# Скоупы и сериализация

В слое совместимости `fork()` создает scope.

```ts
const appScope = fork();
```

## Начальное состояние

Используйте `sid` стора, чтобы передать начальные значения объектом.

```ts
const $count = createStore(0, { sid: "count" });

const appScope = fork({
  values: {
    count: 10,
  },
});
```

## Запуск юнита

```ts
await allSettled(incremented, {
  scope: appScope,
  params: 1,
});
```

Эффекты возвращают объект со статусом.

```ts
const result = await allSettled(loadFx, {
  scope: appScope,
  params: "user:1",
});

if (result.status === "done") {
  console.log(result.value);
}
```

## Привязка callback

Используйте `scopeBind`, когда callback сработает позже.

```ts
const boundIncrement = scopeBind(incremented, {
  scope: appScope,
});

setTimeout(() => {
  void boundIncrement(1);
});
```

## Сериализация

```ts
const values = serialize(appScope);
```

Hydrate другого scope:

```ts
const nextScope = fork();

hydrate(nextScope, { values });
```

Игнорировать выбранные сторы:

```ts
serialize(appScope, {
  ignore: [$count],
});
```

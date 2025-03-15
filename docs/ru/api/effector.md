# @virentia/effector API

`@virentia/effector` — пакет совместимости с API в стиле Effector.

## createEvent

Используйте `createEvent` для событий и уведомлений в моделях Effector-стиля.

```ts
const submitted = createEvent<string>("submitted");

submitted.watch((value) => {
  console.log(value);
});
```

События поддерживают `map`, `filter`, `filterMap` и `prepend`.

```ts
const numbers = submitted.filterMap((value) => Number(value) || undefined);
const positive = numbers.filter((value) => value > 0);
const label = positive.map((value) => `#${value}`);
```

## createStore

Используйте `createStore` для состояния в scope с API в стиле Effector.

```ts
const incremented = createEvent<number>();
const reset = createEvent<void>();

const $count = createStore(0, { sid: "count" })
  .on(incremented, (count, amount) => count + amount)
  .reset(reset);
```

Чтение и запись состояния:

```ts
$count.getState();
$count.setState(10);
```

Сторы раскрывают `updates`, `map`, `on`, `reset` и `watch`.

## createEffect

Используйте `createEffect` для асинхронной работы и юнитов жизненного цикла в стиле Effector.

```ts
const loadUserFx = createEffect<string, { id: string; name: string }>(async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});
```

Эффекты раскрывают:

```ts
loadUserFx.done;
loadUserFx.fail;
loadUserFx.finally;
loadUserFx.doneData;
loadUserFx.failData;
loadUserFx.pending;
loadUserFx.inFlight;
```

Заменить или задать handler:

```ts
loadUserFx.use(async (id) => ({ id, name: "Ada" }));
```

## fork и allSettled

Используйте `fork`, чтобы создать scope. Используйте `allSettled`, чтобы запустить юнит внутри этого scope и дождаться асинхронной работы.

```ts
const appScope = fork({
  values: {
    count: 10,
  },
});

await allSettled(incremented, {
  scope: appScope,
  params: 2,
});

console.log(appScope.getState($count)); // 12
```

Эффекты возвращают объект со статусом:

```ts
const result = await allSettled(loadUserFx, {
  scope: appScope,
  params: "user:1",
});
```

## sample

Используйте `sample`, когда один юнит должен взять состояние другого юнита в момент срабатывания.

```ts
sample({
  source: $count,
  clock: submitted,
  filter: (count) => count > 0,
  fn: (count, text) => `${text}:${count}`,
  target: saved,
});
```

## combine

Используйте `combine`, когда значение всегда выводится из нескольких сторов.

```ts
const $fullName = combine(
  { firstName: $firstName, lastName: $lastName },
  ({ firstName, lastName }) => `${firstName} ${lastName}`,
);
```

## split

Используйте `split`, когда одно событие нужно разложить по именованным веткам.

```ts
const routed = split(submitted, {
  short: (text) => text.length < 10,
  long: (text) => text.length >= 10,
});
```

## createApi и restore

Используйте `restore`, чтобы превратить payload события в состояние. Используйте `createApi`, чтобы создать несколько событий, обновляющих один стор.

```ts
const changed = createEvent<string>();
const $value = restore(changed, "");

const api = createApi($value, {
  upper: (value) => value.toUpperCase(),
  append: (value, suffix: string) => `${value}${suffix}`,
});
```

## attach

Используйте `attach`, когда вызову эффекта нужно добавить состояние из стора в params.

```ts
const authorizedFx = attach({
  source: $token,
  effect: requestFx,
  mapParams: (id: number, token: string) => ({ id, token }),
});
```

## serialize и hydrate

Используйте это для переноса состояния scope между средами выполнения: обычно с сервера на клиент или из сохраненной сессии в новый scope.

```ts
const values = serialize(appScope);

const nextScope = fork();
hydrate(nextScope, { values });
```

## scopeBind

Используйте `scopeBind`, когда callback сработает позже, но должен запустить юнит в известном scope.

```ts
const boundSubmit = scopeBind(submitted, { scope: appScope });

await boundSubmit("hello");
```

## is

Используйте проверки из `is` во вспомогательных функциях, которые принимают неизвестные юниты.

```ts
is.unit(submitted);
is.event(submitted);
is.store($count);
is.effect(loadUserFx);
is.targetable($count);
```

`is.targetable` возвращает true для вызываемых событий, writable-сторов и эффектов.

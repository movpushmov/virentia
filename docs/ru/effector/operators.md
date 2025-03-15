# Операторы

Слой совместимости включает распространенные операторы в стиле Effector.

## sample

Используйте `sample`, чтобы взять состояние в момент, когда сработал другой юнит.

```ts
sample({
  source: $count,
  clock: submitted,
  fn: (count, text) => `${text}:${count}`,
  target: saved,
});
```

С filter:

```ts
sample({
  source: { prefix: $prefix, enabled: $enabled },
  clock: submitted,
  filter: ({ enabled }) => enabled,
  fn: ({ prefix }, value) => `${prefix}${value}`,
  target,
});
```

## combine

Используйте `combine` для derived-сторов.

```ts
const $fullName = combine(
  { firstName: $firstName, lastName: $lastName },
  ({ firstName, lastName }) => `${firstName} ${lastName}`,
);
```

## split

Используйте `split`, чтобы разложить одно событие по веткам.

```ts
const routed = split(submitted, {
  even: (value) => value % 2 === 0,
  odd: (value) => value % 2 === 1,
});
```

Payloads без совпадения попадут в `routed.__`.

## createApi

Используйте `createApi`, чтобы создать несколько событий, обновляющих один стор.

```ts
const api = createApi($count, {
  add: (count, amount: number) => count + amount,
  reset: () => 0,
});

api.add(1);
api.reset();
```

## restore

Используйте `restore`, чтобы хранить payload события или результат эффекта.

```ts
const submitted = createEvent<string>();
const $value = restore(submitted, "initial");
```

## attach

Используйте `attach`, чтобы добавить состояние из стора в вызов эффекта.

```ts
const requestFx = createEffect<{ token: string; id: number }, string>();
const $token = createStore("root");

const authorizedFx = attach({
  source: $token,
  effect: requestFx,
  mapParams: (id: number, token: string) => ({ token, id }),
});
```

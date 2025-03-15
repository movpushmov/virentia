# Operators

The bridge includes common Effector-style operators.

## sample

Use `sample` to take state at the moment another unit fires.

```ts
sample({
  source: $count,
  clock: submitted,
  fn: (count, text) => `${text}:${count}`,
  target: saved,
});
```

With a filter:

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

Use `combine` for derived stores.

```ts
const $fullName = combine(
  { firstName: $firstName, lastName: $lastName },
  ({ firstName, lastName }) => `${firstName} ${lastName}`,
);
```

## split

Use `split` to route one event into cases.

```ts
const routed = split(submitted, {
  even: (value) => value % 2 === 0,
  odd: (value) => value % 2 === 1,
});
```

Unmatched payloads go to `routed.__`.

## createApi

Use `createApi` to create several events that update one store.

```ts
const api = createApi($count, {
  add: (count, amount: number) => count + amount,
  reset: () => 0,
});

api.add(1);
api.reset();
```

## restore

Use `restore` to store event payloads or effect results.

```ts
const submitted = createEvent<string>();
const $value = restore(submitted, "initial");
```

## attach

Use `attach` to add state to an effect call.

```ts
const requestFx = createEffect<{ token: string; id: number }, string>();
const $token = createStore("root");

const authorizedFx = attach({
  source: $token,
  effect: requestFx,
  mapParams: (id: number, token: string) => ({ token, id }),
});
```

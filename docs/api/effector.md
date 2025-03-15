# @virentia/effector API

`@virentia/effector` is the Effector-shaped bridge package.

## createEvent

Use `createEvent` for model events and notifications in Effector-shaped models.

```ts
const submitted = createEvent<string>("submitted");

submitted.watch((value) => {
  console.log(value);
});
```

Events support `map`, `filter`, `filterMap`, and `prepend`.

```ts
const numbers = submitted.filterMap((value) => Number(value) || undefined);
const positive = numbers.filter((value) => value > 0);
const label = positive.map((value) => `#${value}`);
```

## createStore

Use `createStore` for scoped state while keeping the Effector-style API.

```ts
const incremented = createEvent<number>();
const reset = createEvent<void>();

const $count = createStore(0, { sid: "count" })
  .on(incremented, (count, amount) => count + amount)
  .reset(reset);
```

Read and write state:

```ts
$count.getState();
$count.setState(10);
```

Stores expose `updates`, `map`, `on`, `reset`, and `watch`.

## createEffect

Use `createEffect` for async work with Effector-shaped lifecycle units.

```ts
const loadUserFx = createEffect<string, { id: string; name: string }>(async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});
```

Effects expose:

```ts
loadUserFx.done;
loadUserFx.fail;
loadUserFx.finally;
loadUserFx.doneData;
loadUserFx.failData;
loadUserFx.pending;
loadUserFx.inFlight;
```

Replace or set the handler:

```ts
loadUserFx.use(async (id) => ({ id, name: "Ada" }));
```

## fork and allSettled

Use `fork` to create a scope. Use `allSettled` to run a unit inside that scope and wait for async work.

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

Effects return status objects:

```ts
const result = await allSettled(loadUserFx, {
  scope: appScope,
  params: "user:1",
});
```

## sample

Use `sample` when one unit should take state from another unit at the moment it fires.

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

Use `combine` when a value is always derived from several stores.

```ts
const $fullName = combine(
  { firstName: $firstName, lastName: $lastName },
  ({ firstName, lastName }) => `${firstName} ${lastName}`,
);
```

## split

Use `split` when one event should be routed into named cases.

```ts
const routed = split(submitted, {
  short: (text) => text.length < 10,
  long: (text) => text.length >= 10,
});
```

## createApi and restore

Use `restore` to turn event payloads into state. Use `createApi` to create several events that update one store.

```ts
const changed = createEvent<string>();
const $value = restore(changed, "");

const api = createApi($value, {
  upper: (value) => value.toUpperCase(),
  append: (value, suffix: string) => `${value}${suffix}`,
});
```

## attach

Use `attach` when an effect call needs store state added to its params.

```ts
const authorizedFx = attach({
  source: $token,
  effect: requestFx,
  mapParams: (id: number, token: string) => ({ id, token }),
});
```

## serialize and hydrate

Use these for transferring scoped state between runtimes, usually server to client or one saved session to another scope.

```ts
const values = serialize(appScope);

const nextScope = fork();
hydrate(nextScope, { values });
```

## scopeBind

Use `scopeBind` when a callback fires later but must run a unit in a known scope.

```ts
const boundSubmit = scopeBind(submitted, { scope: appScope });

await boundSubmit("hello");
```

## is

Use `is` guards when writing helpers that accept unknown units.

```ts
is.unit(submitted);
is.event(submitted);
is.store($count);
is.effect(loadUserFx);
is.targetable($count);
```

`is.targetable` returns true for callable events, writable stores, and effects.

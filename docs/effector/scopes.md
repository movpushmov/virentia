# Scopes and Serialization

In the bridge, `fork()` creates a scope.

```ts
const appScope = fork();
```

## Initial State

Use store `sid` to hydrate by object.

```ts
const $count = createStore(0, { sid: "count" });

const appScope = fork({
  values: {
    count: 10,
  },
});
```

## Unit Run

```ts
await allSettled(incremented, {
  scope: appScope,
  params: 1,
});
```

Effects return a status object.

```ts
const result = await allSettled(loadFx, {
  scope: appScope,
  params: "user:1",
});

if (result.status === "done") {
  console.log(result.value);
}
```

## Bind A Callback

Use `scopeBind` when a callback fires later.

```ts
const boundIncrement = scopeBind(incremented, {
  scope: appScope,
});

setTimeout(() => {
  void boundIncrement(1);
});
```

## Serialize

```ts
const values = serialize(appScope);
```

Hydrate another scope:

```ts
const nextScope = fork();

hydrate(nextScope, { values });
```

Ignore selected stores:

```ts
serialize(appScope, {
  ignore: [$count],
});
```

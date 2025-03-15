# Scopes

A scope is one running state instance.

The model describes stores, events, effects, and reactions. The scope holds the concrete store values. That lets one model run in an app, a test, an SSR request, a widget, or a cached background screen at the same time.

## Scope For Store Access

When code reads `count.value`, the store has to know which copy of `count` you mean. Direct reads and writes therefore need a scope in the current execution context.

```ts
scoped(appScope, () => {
  count.value += 1;
});
```

`scoped(scope, fn)` opens a scope, runs the function, and restores the previous scope when the function finishes. If the function returns a promise, the same scope is kept for that promise chain until it settles.

## One Tool For Runs And Callbacks

You can use `scoped` immediately:

```ts
await scoped(appScope, async () => {
  const response = await fetch("/api/count");
  count.value = (await response.json()).count;
});
```

You can also create a runner and reuse it where code would otherwise start to sprawl:

```ts
const inAppScope = scoped(appScope);

await inAppScope(async () => {
  count.value += 1;
});

const onMessage = inAppScope.wrap((message: string) => {
  messages.items = [...messages.items, message];
});

socket.on("message", onMessage);
```

The same object handles both jobs: run work now, or keep a callback that will return to the same scope later.

If the code already runs inside a scope, you can omit the scope argument:

```ts
scoped(appScope, () => {
  scoped(() => {
    count.value += 1;
  });
});
```

## allSettled At Boundaries

`scoped` is convenient for plain code. But when you start a unit at a system boundary — from a test, server loader, command, or framework adapter — `allSettled` is usually clearer.

```ts
await allSettled(incremented, {
  scope: appScope,
  payload: 1,
});
```

`allSettled` shows which unit starts, which scope owns the state, and which payload enters the graph. It also waits for async work raised by that run.

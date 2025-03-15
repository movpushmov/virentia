# @virentia/effector

Effector-shaped compatibility layer powered by `@virentia/core`.

Use this package when existing code already has an Effector-style shape and you want to run it on Virentia primitives.

## Links

- Documentation: [movpushmov.dev/virentia/effector](https://movpushmov.dev/virentia/effector/)

## Install

```sh
pnpm add @virentia/effector
```

## Counter

```ts
import { allSettled, createEvent, createStore, fork } from "@virentia/effector";

const incremented = createEvent<number>();
const $count = createStore(0).on(incremented, (count, amount) => count + amount);

const appScope = fork();

await allSettled(incremented, {
  scope: appScope,
  params: 2,
});

console.log(appScope.getState($count)); // 2
```

## Effects

```ts
const loadUserFx = createEffect<string, { id: string; name: string }>(async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

const result = await allSettled(loadUserFx, {
  scope: appScope,
  params: "user:1",
});
```

Effects expose Effector-shaped lifecycle units: `done`, `fail`, `finally`, `doneData`, `failData`, `pending`, and `inFlight`.

## Main API

`createEvent`, `createStore`, `createEffect`, `sample`, `combine`, `split`, `createApi`, `restore`, `attach`, `fork`, `allSettled`, `serialize`, `hydrate`, `scopeBind`, `is`.

## Notes

The bridge keeps Effector-shaped names around Virentia core primitives. `fork` creates a Virentia scope. `allSettled` uses `params`, while core `allSettled` uses `payload`.

## License

MIT © 2026 movpushmov

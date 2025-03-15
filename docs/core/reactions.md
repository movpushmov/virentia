# Reactions

A reaction is a model rule. It does not store state, report a fact, or perform external work. Its job is to connect those parts: an event happened, a store changed, an effect finished, so the model should run a rule.

Most reactions live near the units they connect. That makes the model show not only “which data exists”, but also “why it changes”.

```ts
const queryChanged = event<string>();
const searchSubmitted = event<void>();

const query = store("");
const results = store({ items: [] as string[] });

const searchFx = effect(async (text: string) => {
  const response = await fetch(`/api/search?q=${encodeURIComponent(text)}`);
  return (await response.json()) as string[];
});

reaction({
  on: queryChanged,
  run(text) {
    query.value = text;
  },
});

reaction({
  on: searchSubmitted,
  run() {
    void searchFx(query.value);
  },
});

reaction({
  on: searchFx.doneData,
  run(items) {
    results.items = items;
  },
});
```

The events stay small: they name what happened. The effect owns the request. Stores remember state. Reactions describe the causality between them.

## Automatic Dependencies

By default, start with a reaction without `on`. Inside that reaction you read stores, and Virentia remembers which stores the rule depends on. When one of those stores changes, the reaction runs again in the same scope.

```ts
const query = store("");
const online = store(true);
const canSearch = store(false);

reaction(() => {
  canSearch.value = online.value && query.value.trim().length > 2;
});
```

This mode is useful when dependencies are easier to express by reading state than by listing sources. If the rule branches, the dependency list is refreshed after every run: the reaction listens to the stores read by the current branch.

If a value is completely derived from other stores and does not need to be written into another store, look at `computed` first. Use a reaction when the rule should do something: write state, call an effect, send an event, or synchronize with external code.

## Explicit on

Use `on` when the reason for running matters: a specific event, effect, or effect lifecycle unit. In this mode the reaction does not run when it is created. It runs only from the listed unit and receives its payload.

```ts
reaction({
  on: messageReceived,
  run(message) {
    messages.items = [...messages.items, message];
  },
});
```

Use explicit `on` when the payload is part of the rule. For example: “a message arrived”, “the form was submitted”, “the request finished”, “the effect was cancelled”. That reads better than a reaction that only watches state and tries to infer what happened.

You can listen to several sources when the rule is genuinely the same:

```ts
reaction({
  on: [saved, cancelled],
  run() {
    modalOpened.value = false;
  },
});
```

## Stopping

A reaction returns an object with `stop()`. After it is stopped, it detaches from dependencies and no longer receives new runs.

```ts
const subscription = reaction({
  on: ticked,
  run() {
    count.value += 1;
  },
});

subscription.stop();
```

In dynamic models you usually do not need to call `stop()` by hand. Create those reactions inside an `owner`: when `dispose` runs, Virentia detaches them together with the rest of the temporary work.

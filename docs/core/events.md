# Events

An event tells the model that something happened. It does not store state and does not decide what happens next. Its job is to carry a payload into the graph so reactions can respond.

```ts
const queryChanged = event<string>();
const submitted = event<void>();
```

A good event sounds like a fact: `queryChanged`, `submitted`, `messageReceived`, `routeOpened`. A weaker event often sounds like a technical command: `setQuery`, `updateState`, `handleSubmit`. A command ties the model to a mutation method. A fact lets the model have several rules.

## State Changes Live In Reactions

An event does not change state by itself. State changes in a reaction.

```ts
reaction({
  on: queryChanged,
  run(text) {
    query.value = text;
  },
});
```

Several rules can react to one event. `submitted` can start a search effect, clear an error, and record the last submit time. The event still stays small and readable.

## Payload

The payload is the event data. For `queryChanged`, it is the new text. For `messageReceived`, it is the message. For `submitted`, no payload may be needed, so use `event<void>()`.

Do not put more into the payload than a rule needs. If a reaction can read the current value from a store, it is often better to read it there than to carry extra data through the event.

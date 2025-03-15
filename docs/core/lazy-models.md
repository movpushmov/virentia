# Lazy Models

Use `lazyModel` when a feature model lives in another module and should be loaded only when the application actually touches one of its units. This is useful for heavy screens, rarely opened flows, editor panels, chat tabs, and other code that should not be part of the first bundle.

The lazy object has the same shape as the real model. You can reference its units in rules before the module is loaded:

```ts
import { event, lazyModel, reaction, store } from "@virentia/core";
import type { createChatModel } from "./chat.model";

const chat = lazyModel<ReturnType<typeof createChatModel>>(() =>
  import("./chat.model").then(({ createChatModel }) => createChatModel()),
);

const routeOpened = event<{ chatId: string }>();
const refreshRequested = event<{ chatId: string }>();

const currentChatId = store<string | null>(null);
const messageCount = store(0);

reaction({
  on: routeOpened,
  run({ chatId }) {
    void chat.opened({ chatId });
  },
});

reaction({
  on: refreshRequested,
  run({ chatId }) {
    void chat.loadHistoryFx(chatId);
  },
});
```

Here the current model describes what happened in the application, while the lazy model is loaded only when `chat.opened` or `chat.loadHistoryFx` is called. That keeps routing, commands, and background refreshes close to the current model without loading the chat code ahead of time.

You can also subscribe to lazy units before the module is loaded:

```ts
reaction({
  on: chat.opened,
  run({ chatId }) {
    currentChatId.value = chatId;
  },
});

reaction({
  on: chat.loadHistoryFx.doneData,
  run(messages) {
    messageCount.value = messages.length;
  },
});
```

When a lazy unit is launched, Virentia pauses the placeholder branch, waits for the module, connects existing listeners to the real unit, and launches the real unit with the same payload and scope.

```ts
await allSettled(chat.opened, {
  scope: appScope,
  payload: { chatId: "support" },
});
```

::: warning

Lazy models can wait for loading when an event, effect, or effect lifecycle unit is launched. Store reads stay synchronous: `chat.messages.value` cannot wait for an import.

Read lazy stores after the model has been loaded by an event or effect. If a screen needs loading state before the module is loaded, keep that small shell state near the place that starts the scenario.

:::

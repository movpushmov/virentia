# Кеш моделей в React

Используйте этот рецепт для экранов, которые должны продолжать жить после размонтирования.

## Модель

```tsx
import { effect, event, reaction, store } from "@virentia/core";
import { component, createModelCache, type ModelContext } from "@virentia/react";

type Props = {
  chatId: string;
};

function createChatModel({ key, mounted }: ModelContext<Props, string>) {
  const messageSubmitted = event<string>();
  const messages = store({ items: [] as string[] });
  const loadFx = effect(async (chatId: string) => [`loaded:${chatId}`]);

  reaction({
    on: mounted,
    run() {
      void loadFx(key);
    },
  });

  reaction({
    on: messageSubmitted,
    run(text) {
      messages.items = [...messages.items, text];
    },
  });

  reaction({
    on: loadFx.doneData,
    run(items) {
      messages.items = items;
    },
  });

  return {
    loading: loadFx.$pending,
    messageSubmitted,
    messages,
  };
}
```

## Кеш

```ts
type ChatModel = ReturnType<typeof createChatModel>;

export const chatCache = createModelCache<string, Props, ChatModel>();
```

## Компонент

```tsx
export const ChatPanel = component({
  cache: chatCache,
  key: (props: Props) => props.chatId,
  model: createChatModel,
  view({ model }) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void model.messageSubmitted("hello");
        }}
      >
        <div>{model.messages.items.join(", ")}</div>
        <button disabled={model.loading}>Send</button>
      </form>
    );
  },
});
```

## Очистка

```ts
chatCache.delete("support", appScope);
chatCache.clear(appScope);
```

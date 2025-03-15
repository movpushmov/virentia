# Cached Models

Use a model cache when unmounting a component should not destroy its model.

This is useful for chats, editor tabs, media players, previews, and detail screens that should reopen with their previous state. A cache is also a lifetime decision: the model will stay in memory until you delete it or clear the cache.

## Key The Model

Cached models are stored by key inside a scope. For a chat, the key can be `chatId`. For editor tabs, it can be a document id. The key should describe the thing the user expects to return to.

```tsx
const chatCache = createModelCache<string, Props, ChatModel>();

export const ChatPanel = component({
  cache: chatCache,
  key: (props: Props) => props.chatId,
  model: createChatModel,
  view({ model }) {
    return <div>{model.messages.items.join(", ")}</div>;
  },
});
```

When `ChatPanel` unmounts, the cached model stays alive. When the same key appears again in the same scope, React gets the existing model instead of creating a fresh one.

## Loading Logic In The Model

The model can use `mounted` to load data the first time it appears:

```tsx
function createChatModel({ key, mounted }: ModelContext<Props, string>) {
  const messages = store({ items: [] as string[] });
  const loadFx = effect(async (chatId: string) => [`loaded:${chatId}`]);

  reaction({
    on: mounted,
    run() {
      void loadFx(key);
    },
  });

  return { loading: loadFx.$pending, messages };
}
```

For cached models, think carefully about whether `mounted` should reload every time a view returns or only when the model is first created. If reloads are expensive, keep an additional store like `loaded` and guard the reaction.

## Dispose Deliberately

Caching trades memory for continuity. Delete a model when the user closes the chat, tab, player, or preview for good.

```ts
chatCache.delete("support", appScope);
chatCache.clear(appScope);
```

Deleting a cached model disposes its owner, so reactions and cleanup registered inside the model are detached as well.

# Ленивые модели

`lazyModel` нужен, когда модель фичи лежит в отдельном модуле и должна загрузиться только в момент реальной работы. Так удобно выносить тяжелые экраны, редко открываемые сценарии, редакторы, вкладки чатов и другой код, который не должен попадать в первый bundle.

Ленивая модель выглядит как настоящая модель. На ее юниты можно ссылаться в правилах до загрузки модуля:

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

Здесь обычная модель решает, что произошло в приложении, а ленивая модель подключается только в момент вызова `chat.opened` или `chat.loadHistoryFx`. Так можно держать переходы, команды и фоновые обновления рядом с текущей моделью, не загружая код чата заранее.

На lazy-юниты можно и подписываться до загрузки модуля:

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

Когда запускается lazy-юнит, Virentia ставит ветку с подставным юнитом на паузу, ждет загрузки модуля, переносит уже подключенные реакции на настоящий юнит и запускает его с тем же payload и scope.

```ts
await allSettled(chat.opened, {
  scope: appScope,
  payload: { chatId: "support" },
});
```

::: warning

Ленивая модель умеет ждать загрузку при запуске события, эффекта или lifecycle-юнита эффекта. Чтение стора остается синхронным: `chat.messages.value` не может ждать `import`.

Читайте сторы ленивой модели после того, как модель загрузилась через событие или эффект. Если экрану нужен loading до загрузки модуля, держите это состояние рядом с местом, которое запускает сценарий.

:::

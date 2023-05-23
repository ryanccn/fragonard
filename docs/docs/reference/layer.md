# Layer

A **layer** is the core concept of Fragonard. It groups functionality together and includes listeners, commands, buttons, and exposed APIs.

Each layer must have a unique ID. When writing your own layer, make sure to choose one that is **unique and identifiable**, especially if it's meant to be published.

## `defineLayer`

`defineLayer` is how you would define a layer. It is a no-op function that enforces strict typings for your layers.

```typescript
const testLayer = defineLayer({
  id: "test-layer",
  listeners: [
    {
      event: Events.MessageCreate,
      listener: async ({ message }) => {
        if (message.author.bot) return;
        await message.reply("Hello 3");
      },
    },
  ],
});
```

The type IntelliSense also works in JavaScript source files.

## Listeners

The `listeners` key in the layer is the canonical way to add listeners to your layer.

Listeners will be called in the order of the layers being used on the Fragonard client, and earlier layers can choose to stop propagation.

Listeners are passed into the array in the form of an object with `event` being a member of the `Events` enum from `discord.js`, and the listener is a function that accepts data and returns either `void` or `Promise<void>`.

::: tip
Fragonard is fully async-friendly.
:::

The data passed in as an object includes the arguments that Discord.js would normally pass to event handlers, and two additional global context variables: `ctx` and `logger`. Refer to [Context](./context.md) and [Logger](./logger.md) for their respective APIs.

## Commands

Commands can also be passed in as an array to the `commands` key. This is the recommended method for defining commands.

The `type` key is either of `LayerCommandType.SlashCommand` for slash commands and `LayerCommandType.ContextMenuCommand` for context menu commands.

The data about the command itself is passed in through `data`, where you would use a builder from discord.js.

The handler is similar to the listeners above; an interaction is passed in, along with the base context.

```typescript
export const pingLayer = defineLayer({
  id: "ping-layer",
  commands: [
    {
      type: LayerCommandType.SlashCommand,
      data: new SlashCommandBuilder().setName("ping").setDescription("Ping!"),
      handler: async ({ interaction, logger }) => {
        logger.info("Received ping interaction");
        await interaction.reply("Pong!");
      },
    },
  ],
});
```

## Buttons

Buttons can be passed in via the `buttons` key, as an array as well.

Each button has a `customId` key, which can either be a static string or a `RegExp`. Interactions with button custom IDs matching the regex will call the handler.

The `handler` signature is similar to that of commands.

## API

::: info
This part of the documentation is unfinished.
:::

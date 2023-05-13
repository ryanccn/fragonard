# Getting started

::: warning
Fragonard is in a pre-release state, currently does not follow SemVer, and its API may change at any time. Only use it if you are okay with dealing with unexpected changes.
:::

It is highly recommended to use [TypeScript](https://www.typescriptlang.org/) with Fragonard for best in class developer experience and type safety.

## Installation

Create a typical Node.js project first with your package manager of choice (the rest of this documentation is going to use Yarn as an example):

```bash
$ mkdir <name-of-project> && cd <name-of-project>
$ yarn init -y
```

Then, install **both Fragonard and Discord.js**. Discord.js is a peer dependency and not installed when you install Fragonard.

```bash
$ yarn add @fragonard/core discord.js
```

If you choose to use TypeScript (which, again, is the recommendation), we also recommend using [tsx](https://github.com/esbuild-kit/tsx) to run TypeScript files easily through a CLI.

```bash
$ yarn add -D tsx typescript @types/node
```

## Initializing the Fragonard client

Now that everything is ready, go ahead and create `index.ts`, which is going to be the entrypoint to your bot.

Here is an example of how you would set up the entrypoint:

```typescript
import { Client } from "@fragonard/core";
import { GatewayIntentBits, OAuth2Scopes } from "discord.js";

const client = new Client({
  discordOptions: {
    intents:
      GatewayIntentBits.Guilds |
      GatewayIntentBits.GuildMessages |
      GatewayIntentBits.GuildMessageTyping |
      GatewayIntentBits.GuildMembers |
      GatewayIntentBits.MessageContent,
  },
});

client.login({
  app: process.env.DISCORD_APP,
  token: process.env.DISCORD_TOKEN,
});
```

:::info
Providing a list of intents to Discord.js is required for the bot to function.
:::

Provide `DISCORD_APP` and `DISCORD_TOKEN` as the application ID and the bot token of your bot application, respectively. These variables are required for Fragonard to connect to Discord and update commands.

At this point, your bot has been initialized and can run, but it does nothing.

## Adding your first layer

Layers are the core concept of Fragonard. They are modular, independent objects that have their own ID, listeners, commands, and more.

For convenience, we provide a `defineLayer` function to make typing layers easier.

Here is an example of a layer:

```typescript
import { defineLayer, LayerCommandType } from "@fragonard/core";
import { SlashCommandBuilder } from "discord.js";

export const pingLayer = defineLayer({
  id: "ping-layer",
  listeners: [
    {
      event: Events.MessageCreate,
      listener: async ({ message, logger }) => {
        if (message.author.bot) return;
        await message.reply({
          content: "Hello :p",
        });

        logger.log(`Replied to message ${message.id}`);
      },
    },
  ],
  commands: [
    {
      type: LayerCommandType.SlashCommand,
      data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Ping the bot!"),
      handler: async ({ interaction, logger }) => {
        await interaction.reply("Pong!");
      },
    },
  ],
});
```

As you can probably expect, each layer ideally should encapsulate their own functionality. Different features in a bot should be in different layers with modularized behavior for better reusability and debugging.

To actually use the layer in your Fragonard bot, register it on the client using `use` before the client is logged in:

```typescript
client.use(pingLayer);
```

## Advanced layer usage

The argument that listeners and command handlers receive are objects. They include the data related to the event itself depending on what the event is, but also includes two variables from the Fragonard client's internal context: `ctx` and `logger`.

`ctx` is an instance of class `Context` that exposes a few methods useful for interacting with the Fragonard client. For instance, `ctx.stopPropagation()` prevents layers further down the line from executing on the received event.

`logger` is an instance of a custom logger that layers can use to provide logging differen types and colors with the layer ID provided as additional context. Of course, you are free to use other logging solutions like [consola](https://github.com/unjs/consola) or simply `console.log`.

Layers can also define top-level listeners for two special events: `onReady` and `onError`. For instance, here is a layer that logs errors to the console:

```typescript
export const errorCatchingLayer = defineLayer({
  id: "error-layer",
  onError({ error, logger }) {
    logger.error("This is an error from the error catching layer", error);
  },
});
```

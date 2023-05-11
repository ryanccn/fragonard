import "dotenv/config";

import { Client } from "@fragonard/core";
import { Events, GatewayIntentBits, OAuth2Scopes } from "discord.js";

const client = new Client({
	clientOptions: {
		intents:
			GatewayIntentBits.Guilds |
			GatewayIntentBits.GuildMessages |
			GatewayIntentBits.GuildMessageTyping |
			GatewayIntentBits.GuildMembers |
			GatewayIntentBits.MessageContent,
	},
});

client.use({
	id: "test-layer-1",
	listeners: [
		{
			event: Events.MessageCreate,
			listener: async ({ message }) => {
				if (message.author.bot) return;
				await message.reply("Hello 1");
			},
		},
	],
});

client.use({
	id: "test-layer-2",
	listeners: [
		{
			event: Events.MessageCreate,
			listener: async ({ message, ctx }) => {
				if (message.author.bot) return;
				await message.reply("Hello 2");
				ctx.stopPropagation();
			},
		},
	],
});

client.use({
	id: "test-layer-3",
	listeners: [
		{
			event: Events.MessageCreate,
			listener: async ({ message, ctx }) => {
				if (message.author.bot) return;
				await message.reply("Hello 3");
				ctx.stopPropagation();
			},
		},
	],
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
client.login(process.env.DISCORD_TOKEN!).then(() => {
	console.log(client.discord.generateInvite({ scopes: [OAuth2Scopes.Bot] }));
});

import { Layer } from "@fragonard/core";
import { Events } from "discord.js";

export const testLayer1 = {
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
	api: {
		getMessage: () => ":moyai:",
	},
} satisfies Layer;

export const testLayer2 = {
	id: "test-layer-2",
	listeners: [
		{
			event: Events.MessageCreate,
			listener: async ({ message, ctx }) => {
				if (message.author.bot) return;
				await message.reply(`Hello, ${ctx.getAPI(testLayer1).getMessage()}`);
				ctx.stopPropagation();
			},
		},
	],
} satisfies Layer;

export const testLayer3 = {
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
} satisfies Layer;

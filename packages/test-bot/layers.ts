import { Layer, LayerCommandType } from "@fragonard/core";
import { Events, SlashCommandBuilder } from "discord.js";

export const testLayer1 = {
	id: "test-layer-1",
	listeners: [
		{
			event: Events.MessageCreate,
			listener: async ({ message, logger }) => {
				if (message.author.bot) return;
				await message.reply({
					content: "Hello 1",
					allowedMentions: { parse: [] },
				});

				logger.warn("Boop!");
			},
		},
	],
	commands: [
		{
			type: LayerCommandType.SlashCommand,
			data: new SlashCommandBuilder().setName("ping").setDescription("Ping!"),
			handler: async ({ interaction, logger }) => {
				logger.info("owo!");
				await interaction.reply("🥺");
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
			listener: async ({ message, ctx, logger }) => {
				if (message.author.bot) return;

				await message.reply({
					content: `Hello, ${ctx.getAPI(testLayer1).getMessage()}`,
					allowedMentions: { parse: [] },
				});
				logger.warn("moyai'd, stopping propagation");

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

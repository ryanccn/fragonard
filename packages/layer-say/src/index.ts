import { defineLayer, LayerCommandType } from "@fragonard/core";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export default defineLayer({
	id: "official-layer-say",
	commands: [
		{
			type: LayerCommandType.SlashCommand,
			data: new SlashCommandBuilder()
				.setName("say")
				.setDescription("Say something through the bot")
				.addStringOption((option) =>
					option
						.setName("content")
						.setDescription("The content to say")
						.setRequired(true)
				)
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
			handler: async ({ interaction }) => {
				if (!interaction.channel) return;

				await interaction.deferReply();

				const content = interaction.options.getString("content", true);
				await interaction.channel.send(content);

				await interaction.editReply("Sent message!");
			},
		},
	],
});

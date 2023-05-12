import { defineLayer } from "@fragonard/core";
import { Colors, EmbedBuilder } from "discord.js";

export default (guild: string, channel: string) =>
	defineLayer({
		id: "official-layer-error-logging",
		async onError({ error, ctx, logger }) {
			const resolvedGuild = await ctx.client.discord.guilds.fetch(guild);
			const resolvedChannel = await resolvedGuild.channels.fetch(channel);

			if (!resolvedChannel) {
				logger.error(`Channel ${channel} could not be found, aborting`);
				return;
			}
			if (!resolvedChannel.isTextBased()) {
				logger.error(`Channel ${channel} is not text based, aborting`);
				return;
			}

			await resolvedChannel.send({
				embeds: [
					new EmbedBuilder()
						.setTitle("An error occurred!")
						.setDescription(
							"```\n" + (error.stack ?? error.toString()) + "\n```"
						)
						.setColor(Colors.Red)
						.setTimestamp(Date.now()),
				],
			});
		},
	});

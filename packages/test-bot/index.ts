import "dotenv/config";

import { Client } from "@fragonard/core";
import { GatewayIntentBits, OAuth2Scopes } from "discord.js";
import {
	errorCatchingLayer,
	testLayer1,
	testLayer2,
	testLayer3,
} from "./layers";

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

client.use(testLayer1);
client.use(testLayer2);
client.use(testLayer3);
client.use(errorCatchingLayer);

client
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	.login({ app: process.env.DISCORD_APP!, token: process.env.DISCORD_TOKEN! })
	.then(() => {
		const logger = client.getLogger();

		logger.success("Started Fragonard test bot bot!");
		logger.info(client.discord.generateInvite({ scopes: [OAuth2Scopes.Bot] }));
		logger.warn("This is a test bot. And this is a test warning.");
		logger.error("But this is not an error.");
	});

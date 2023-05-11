import "dotenv/config";

import { Client } from "@fragonard/core";
import { GatewayIntentBits, OAuth2Scopes } from "discord.js";
import { testLayer1, testLayer2, testLayer3 } from "./layers";

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

client.use(testLayer1);
client.use(testLayer2);
client.use(testLayer3);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
client.login(process.env.DISCORD_TOKEN!).then(() => {
	console.log(client.discord.generateInvite({ scopes: [OAuth2Scopes.Bot] }));
});
import { defineLayer } from "@fragonard/core";
import { createClient } from "redis";

const _client = createClient({ url: process.env.REDIS_URL });
_client.on("error", (err) => {
	console.error(err);
});
const client = _client.connect().then(() => _client);

export default defineLayer({
	id: "official-layer-redis",
	api: {
		async get(k: string) {
			return await (await client).get(k);
		},
		async set(k: string, v: string | number) {
			await (await client).set(k, v);
		},
	},
});

import { Client as DiscordClient, ClientOptions, Events } from "discord.js";
import { Layer, LayerListener } from "./layer";

export class Client {
	discord: DiscordClient;
	layers: Layer[];
	private listeners: Map<Events, LayerListener[]>;

	constructor({ clientOptions }: { clientOptions: ClientOptions }) {
		this.discord = new DiscordClient(clientOptions);
		this.layers = [];
		this.listeners = new Map();
	}

	use(layer: Layer) {
		if (this.layers.some((l) => l.id === layer.id)) {
			throw new Error(`Layer with ID ${layer.id} already exists!`);
		}

		this.layers.push(layer);
		this.rebuildListeners();
	}

	private rebuildListeners() {
		for (const layer of this.layers) {
			if (layer.listeners) {
				for (const listener of layer.listeners) {
					const existingArr = this.listeners.get(listener.event);
					if (existingArr) {
						existingArr.push(listener);
					} else {
						this.listeners.set(listener.event, [listener]);
					}
				}
			}
		}
	}

	async login(token: string) {
		await this.discord.login(token);
	}
}

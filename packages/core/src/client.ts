import { Client as DiscordClient, ClientOptions, Events } from "discord.js";
import {
	Layer,
	LayerListener,
	EventListener,
	EventListenerSupportedEvents,
} from "./layer";
import { Context } from "./context";

export class Client {
	discord: DiscordClient;
	layers: Layer[];
	private listeners: Map<EventListenerSupportedEvents, LayerListener[]>;

	constructor({ clientOptions }: { clientOptions: ClientOptions }) {
		this.discord = new DiscordClient(clientOptions);
		this.layers = [];
		this.listeners = new Map();
		this.registerListeners();
	}

	use(layer: Layer) {
		if (this.layers.some((l) => l.id === layer.id)) {
			throw new Error(`Layer with ID ${layer.id} already exists!`);
		}

		this.layers.push(layer);
		this.rebuildListeners();
	}

	private rebuildListeners() {
		this.listeners.clear();

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

	private getListenersOf<E extends EventListenerSupportedEvents>(ev: E) {
		const listenerList = this.listeners.get(ev);
		if (!listenerList) return [];
		return listenerList as EventListener<E>[];
	}

	private registerListeners() {
		this.discord.on(Events.MessageCreate, async (message) => {
			const listeners = this.getListenersOf(Events.MessageCreate);
			const ctx = new Context({ client: this });

			if (listeners)
				for (const listener of listeners) {
					await listener.listener({ message, ctx, client: this });
					if (ctx.shouldStopPropagation) break;
				}
		});

		this.discord.on(Events.MessageDelete, async (message) => {
			const listeners = this.getListenersOf(Events.MessageDelete);
			const ctx = new Context({ client: this });

			if (listeners)
				for (const listener of listeners) {
					await listener.listener({ message, ctx, client: this });
					if (ctx.shouldStopPropagation) break;
				}
		});
	}

	login(token: string) {
		return this.discord.login(token);
	}
}

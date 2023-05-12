import {
	Client as DiscordClient,
	ClientOptions as DiscordOptions,
	Events,
	REST,
	Routes,
	SlashCommandBuilder,
} from "discord.js";
import { Layer } from "~/layer";
import { LayerCommands, LayerSlashCommand } from "~/layer/commands";
import {
	LayerListener,
	EventListener,
	EventListenerSupportedEvents,
} from "~/layer/listeners";
import { Context } from "~/context";
import { createConsola, ConsolaInstance } from "consola";
import { LayerButtons } from "./layer/buttons";

interface ClientOptions {
	discordOptions: DiscordOptions;
	autoUpdateCommands?: boolean;
}

export class Client {
	discord: DiscordClient;
	layers: Layer[];

	private readonly options: ClientOptions;
	private listeners: Map<EventListenerSupportedEvents, LayerListener[]>;
	private listenerLayerMap: Map<LayerListener, Layer>;
	private layerLoggers: Map<Layer, ConsolaInstance>;
	private commands: LayerCommands;
	private buttons: LayerButtons;

	constructor(options: ClientOptions) {
		this.discord = new DiscordClient(options.discordOptions);
		this.options = Object.assign<ClientOptions, ClientOptions>(
			{ discordOptions: options.discordOptions, autoUpdateCommands: true },
			options
		);

		this.layers = [];
		this.listeners = new Map();
		this.listenerLayerMap = new Map();
		this.layerLoggers = new Map();
		this.commands = [];
		this.buttons = [];

		this.registerListeners();
	}

	use(layer: Layer) {
		if (this.discord.isReady()) {
			throw new Error("You can't add additional layers when running!");
		}

		if (this.layers.some((l) => l.id === layer.id)) {
			throw new Error(`Layer with ID ${layer.id} already exists!`);
		}

		this.layers.push(layer);
		this.layerLoggers.set(layer, createConsola().withTag(layer.id));

		this.rebuildListeners();
		this.rebuildCommands();
		this.rebuildButtons();
	}

	private rebuildListeners() {
		this.listeners.clear();
		this.listenerLayerMap.clear();

		for (const layer of this.layers) {
			if (layer.listeners) {
				for (const listener of layer.listeners) {
					this.listenerLayerMap.set(listener, layer);
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

	private rebuildCommands() {
		this.commands = [];

		for (const layer of this.layers) {
			if (layer.commands) this.commands = this.commands.concat(layer.commands);
		}
	}

	private rebuildButtons() {
		this.buttons = [];

		for (const layer of this.layers) {
			if (layer.buttons) this.buttons = this.buttons.concat(layer.buttons);
		}
	}

	private getListenersOf<E extends EventListenerSupportedEvents>(ev: E) {
		const listenerList = this.listeners.get(ev);
		if (!listenerList) return [];
		return listenerList as EventListener<E>[];
	}

	getLayerLogger(layer: Layer) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this.layerLoggers.get(layer)!;
	}

	private getListenerLogger(listener: LayerListener) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this.layerLoggers.get(this.listenerLayerMap.get(listener)!)!;
	}

	private registerListeners() {
		this.discord.on(Events.MessageCreate, async (message) => {
			const listeners = this.getListenersOf(Events.MessageCreate);
			const ctx = new Context({ client: this });

			if (listeners)
				for (const listener of listeners) {
					await listener.listener({
						message,
						ctx,
						client: this,
						logger: this.getListenerLogger(listener),
					});
					if (ctx.shouldStopPropagation) break;
				}
		});

		this.discord.on(Events.MessageDelete, async (message) => {
			const listeners = this.getListenersOf(Events.MessageDelete);
			const ctx = new Context({ client: this });

			if (listeners)
				for (const listener of listeners) {
					await listener.listener({
						message,
						ctx,
						client: this,
						logger: this.getListenerLogger(listener),
					});
					if (ctx.shouldStopPropagation) break;
				}
		});

		this.discord.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction.isChatInputCommand()) return;
			const slashCommands = this.commands.filter(
				(k) => k.data instanceof SlashCommandBuilder
			) as LayerSlashCommand[];

			for (const command of slashCommands) {
				if (command.data.name === interaction.commandName) {
					await command.handler(interaction);
					break;
				}
			}
		});

		this.discord.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction.isButton()) return;

			for (const button of this.buttons) {
				if (
					typeof button.customId === "string"
						? button.customId === interaction.customId
						: !!button.customId.exec(interaction.customId)
				) {
					await button.handler(interaction);
					break;
				}
			}
		});
	}

	private async updateCommands(app: string, token: string) {
		const rest = new REST({ version: "10" }).setToken(token);

		await rest.put(Routes.applicationCommands(app), {
			body: this.commands.map((k) => k.data.toJSON()),
		});
	}

	async login({ app, token }: { app: string; token: string }) {
		if (this.options.autoUpdateCommands) {
			await this.updateCommands(app, token);
		}
		return this.discord.login(token);
	}
}

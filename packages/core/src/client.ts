import {
	Client as DiscordClient,
	ClientOptions as DiscordOptions,
	Events,
	REST,
	Routes,
	SlashCommandBuilder,
} from "discord.js";
import { Layer } from "~/layer";

import {
	LayerCommand,
	LayerCommands,
	LayerSlashCommand,
} from "~/layer/commands";
import {
	LayerListener,
	EventListener,
	EventListenerSupportedEvents,
} from "~/layer/listeners";
import { LayerButtons } from "./layer/buttons";
import { LayerButton } from "./layer/buttons";

import { Context } from "~/context";
import { Logger } from "./logger";

interface ClientOptions {
	discordOptions: DiscordOptions;
	autoUpdateCommands?: boolean;
}

export class Client {
	public discord: DiscordClient;
	public layers: Layer[];

	private readonly options: ClientOptions;
	private listeners: Map<EventListenerSupportedEvents, LayerListener[]>;
	private layerReverseMap: Map<
		LayerListener | LayerButton | LayerCommand,
		Layer
	>;
	private layerLoggers: Map<Layer, Logger>;
	private commands: LayerCommands;
	private buttons: LayerButtons;

	private globalLogger: Logger;

	constructor(options: ClientOptions) {
		this.discord = new DiscordClient(options.discordOptions);
		this.options = Object.assign<ClientOptions, ClientOptions>(
			{ discordOptions: options.discordOptions, autoUpdateCommands: true },
			options
		);

		this.layers = [];
		this.listeners = new Map();
		this.layerReverseMap = new Map();
		this.layerLoggers = new Map();
		this.commands = [];
		this.buttons = [];

		this.globalLogger = new Logger();

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

		this.layerReverseMap.clear();
		this.rebuildListeners();
		this.rebuildCommands();
		this.rebuildButtons();
	}

	private rebuildListeners() {
		this.listeners.clear();

		for (const layer of this.layers) {
			if (layer.listeners) {
				for (const listener of layer.listeners) {
					this.layerReverseMap.set(listener, layer);
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
			if (layer.commands) {
				this.commands = this.commands.concat(layer.commands);
				layer.commands.forEach((c) => this.layerReverseMap.set(c, layer));
			}
		}
	}

	private rebuildButtons() {
		this.buttons = [];

		for (const layer of this.layers) {
			if (layer.buttons) {
				this.buttons = this.buttons.concat(layer.buttons);
				layer.buttons.forEach((b) => this.layerReverseMap.set(b, layer));
			}
		}
	}

	private getListenersOf<E extends EventListenerSupportedEvents>(ev: E) {
		const listenerList = this.listeners.get(ev);
		if (!listenerList) return [];
		return listenerList as EventListener<E>[];
	}

	getLogger(layer?: Layer) {
		if (!layer) return this.globalLogger;

		const existingLogger = this.layerLoggers.get(layer);
		if (existingLogger) return existingLogger;

		const logger = new Logger(layer.id);
		this.layerLoggers.set(layer, logger);
		return logger;
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
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
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
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
		});

		this.discord.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction.isChatInputCommand()) return;
			const slashCommands = this.commands.filter(
				(k) => k.data instanceof SlashCommandBuilder
			) as LayerSlashCommand[];

			const ctx = new Context({ client: this });

			for (const command of slashCommands) {
				if (command.data.name === interaction.commandName) {
					const logger = this.getLogger(this.layerReverseMap.get(command)!);

					await command.handler({ interaction, ctx, logger });
					break;
				}
			}
		});

		this.discord.on(Events.InteractionCreate, async (interaction) => {
			if (!interaction.isButton()) return;

			const ctx = new Context({ client: this });

			for (const button of this.buttons) {
				if (
					typeof button.customId === "string"
						? button.customId === interaction.customId
						: !!button.customId.exec(interaction.customId)
				) {
					const logger = this.getLogger(this.layerReverseMap.get(button)!);

					await button.handler({ interaction, ctx, logger });
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

import {
	Client as DiscordClient,
	ClientOptions as DiscordOptions,
	Events,
	REST,
	Routes,
	SlashCommandBuilder,
} from "discord.js";
import { Layer, LayerErrorListener, LayerReadyListener } from "~/layer";

import { LayerCommand, LayerSlashCommand } from "~/layer/commands";
import {
	LayerListener,
	EventListener,
	EventListenerSupportedEvents,
} from "~/layer/listeners";
import { LayerButton } from "~/layer/buttons";

import { Context } from "~/context";
import { Logger } from "~/logger";

interface ClientOptions {
	discordOptions: DiscordOptions;
	autoUpdateCommands?: boolean;
}

export class Client {
	public discord: DiscordClient;
	public layers: Layer[];
	private layerLoggers: Map<Layer, Logger>;
	private layerReverseMap: Map<
		| LayerListener
		| LayerButton
		| LayerCommand
		| LayerReadyListener
		| LayerErrorListener,
		Layer
	>;

	private readonly options: ClientOptions;

	private listeners: Map<EventListenerSupportedEvents, LayerListener[]>;
	private readyListeners: LayerReadyListener[];
	private errorListeners: LayerErrorListener[];

	private commands: LayerCommand[];
	private buttons: LayerButton[];

	private globalLogger: Logger;

	constructor(options: ClientOptions) {
		this.discord = new DiscordClient(options.discordOptions);
		this.options = Object.assign<ClientOptions, ClientOptions>(
			{ discordOptions: options.discordOptions, autoUpdateCommands: true },
			options
		);

		this.layers = [];
		this.layerLoggers = new Map();

		this.listeners = new Map();
		this.layerReverseMap = new Map();

		this.readyListeners = [];
		this.errorListeners = [];

		this.commands = [];
		this.buttons = [];

		this.globalLogger = new Logger();

		this.registerListeners();
		this.registerGenericListeners();
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
		this.rebuildSpecialListeners();
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

	private rebuildSpecialListeners() {
		this.readyListeners = [];
		this.errorListeners = [];

		for (const layer of this.layers) {
			if (layer.onReady) {
				this.readyListeners.push(layer.onReady);
				this.layerReverseMap.set(layer.onReady, layer);
			}

			if (layer.onError) {
				this.errorListeners.push(layer.onError);
				this.layerReverseMap.set(layer.onError, layer);
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
		return listenerList as unknown[] as EventListener<E>[];
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
		this.discord.on(Events.ClientReady, async () => {
			const ctx = new Context({ client: this });

			for (const listener of this.readyListeners) {
				await listener({
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});

		this.discord.on(Events.Error, async (error) => {
			const ctx = new Context({ client: this });

			for (const listener of this.errorListeners) {
				await listener({
					error: error,
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

	private registerGenericListeners() {
		this.discord.on(
			Events.ApplicationCommandPermissionsUpdate,
			async (data) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.ApplicationCommandPermissionsUpdate
				)) {
					await listener.listener({
						data,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(
			Events.AutoModerationActionExecution,
			async (autoModerationActionExecution) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.AutoModerationActionExecution
				)) {
					await listener.listener({
						autoModerationActionExecution,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(
			Events.AutoModerationRuleCreate,
			async (autoModerationRule) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.AutoModerationRuleCreate
				)) {
					await listener.listener({
						autoModerationRule,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(
			Events.AutoModerationRuleDelete,
			async (autoModerationRule) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.AutoModerationRuleDelete
				)) {
					await listener.listener({
						autoModerationRule,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(
			Events.AutoModerationRuleUpdate,
			async (oldAutoModerationRule, newAutoModerationRule) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.AutoModerationRuleUpdate
				)) {
					await listener.listener({
						oldAutoModerationRule,
						newAutoModerationRule,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(Events.ClientReady, async (client) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ClientReady)) {
				await listener.listener({
					client,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(
			Events.GuildAuditLogEntryCreate,
			async (auditLogEntry, guild) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.GuildAuditLogEntryCreate
				)) {
					await listener.listener({
						auditLogEntry,
						guild,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(Events.GuildCreate, async (guild) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildCreate)) {
				await listener.listener({
					guild,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildDelete, async (guild) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildDelete)) {
				await listener.listener({
					guild,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildUpdate)) {
				await listener.listener({
					oldGuild,
					newGuild,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildUnavailable, async (guild) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildUnavailable)) {
				await listener.listener({
					guild,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildMemberAdd, async (member) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildMemberAdd)) {
				await listener.listener({
					member,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildMemberRemove, async (member) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildMemberRemove)) {
				await listener.listener({
					member,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildMemberUpdate)) {
				await listener.listener({
					oldMember,
					newMember,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildMemberAvailable, async (member) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildMemberAvailable)) {
				await listener.listener({
					member,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildMembersChunk, async (members, guild, data) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildMembersChunk)) {
				await listener.listener({
					guild,
					members,
					data,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildIntegrationsUpdate, async (guild) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(
				Events.GuildIntegrationsUpdate
			)) {
				await listener.listener({
					guild,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildRoleCreate, async (role) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildRoleCreate)) {
				await listener.listener({
					role,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildRoleDelete, async (role) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildRoleDelete)) {
				await listener.listener({
					role,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.InviteCreate, async (invite) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.InviteCreate)) {
				await listener.listener({
					invite,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.InviteDelete, async (invite) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.InviteDelete)) {
				await listener.listener({
					invite,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildRoleUpdate)) {
				await listener.listener({
					oldRole,
					newRole,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildEmojiCreate, async (emoji) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildEmojiCreate)) {
				await listener.listener({
					emoji,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildEmojiDelete, async (emoji) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildEmojiDelete)) {
				await listener.listener({
					emoji,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildEmojiUpdate, async (oldEmoji, newEmoji) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildEmojiUpdate)) {
				await listener.listener({
					oldEmoji,
					newEmoji,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildBanAdd, async (ban) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildBanAdd)) {
				await listener.listener({
					ban,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildBanRemove, async (ban) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildBanRemove)) {
				await listener.listener({
					ban,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ChannelCreate, async (channel) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ChannelCreate)) {
				await listener.listener({
					channel,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ChannelDelete, async (channel) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ChannelDelete)) {
				await listener.listener({
					channel,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ChannelUpdate)) {
				await listener.listener({
					oldChannel,
					newChannel,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ChannelPinsUpdate, async (channel, date) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ChannelPinsUpdate)) {
				await listener.listener({
					channel,
					date,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.MessageCreate, async (message) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.MessageCreate)) {
				await listener.listener({
					message,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.MessageDelete, async (message) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.MessageDelete)) {
				await listener.listener({
					message,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.MessageUpdate)) {
				await listener.listener({
					oldMessage,
					newMessage,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.MessageBulkDelete, async (messages, channel) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.MessageBulkDelete)) {
				await listener.listener({
					messages,
					channel,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.MessageReactionAdd, async (reaction, user) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.MessageReactionAdd)) {
				await listener.listener({
					reaction,
					user,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.MessageReactionRemove, async (reaction, user) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(
				Events.MessageReactionRemove
			)) {
				await listener.listener({
					reaction,
					user,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(
			Events.MessageReactionRemoveAll,
			async (message, reactions) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.MessageReactionRemoveAll
				)) {
					await listener.listener({
						message,
						reactions,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(Events.MessageReactionRemoveEmoji, async (reaction) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(
				Events.MessageReactionRemoveEmoji
			)) {
				await listener.listener({
					reaction,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ThreadCreate, async (thread, newlyCreated) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ThreadCreate)) {
				await listener.listener({
					thread,
					newlyCreated,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ThreadDelete, async (thread) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ThreadDelete)) {
				await listener.listener({
					thread,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ThreadUpdate, async (oldThread, newThread) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ThreadUpdate)) {
				await listener.listener({
					oldThread,
					newThread,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ThreadListSync, async (threads, guild) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ThreadListSync)) {
				await listener.listener({
					threads,
					guild,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ThreadMemberUpdate, async (oldMember, newMember) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ThreadMemberUpdate)) {
				await listener.listener({
					oldMember,
					newMember,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(
			Events.ThreadMembersUpdate,
			async (addedMembers, removedMembers, thread) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.ThreadMembersUpdate
				)) {
					await listener.listener({
						addedMembers,
						removedMembers,
						thread,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(Events.UserUpdate, async (oldUser, newUser) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.UserUpdate)) {
				await listener.listener({
					oldUser,
					newUser,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.PresenceUpdate)) {
				await listener.listener({
					oldPresence,
					newPresence,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.VoiceStateUpdate, async (oldState, newState) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.VoiceStateUpdate)) {
				await listener.listener({
					oldState,
					newState,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.TypingStart, async (typing) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.TypingStart)) {
				await listener.listener({
					typing,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.WebhooksUpdate, async (channel) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.WebhooksUpdate)) {
				await listener.listener({
					channel,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.InteractionCreate, async (interaction) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.InteractionCreate)) {
				await listener.listener({
					interaction,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.Error, async (error) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.Error)) {
				await listener.listener({
					error,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.CacheSweep, async (message) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.CacheSweep)) {
				await listener.listener({
					message,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ShardDisconnect, async (closeEvent, shardId) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ShardDisconnect)) {
				await listener.listener({
					closeEvent: closeEvent as CloseEvent,
					shardId,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ShardError, async (error, shardId) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ShardError)) {
				await listener.listener({
					error,
					shardId,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ShardReconnecting, async (shardId) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ShardReconnecting)) {
				await listener.listener({
					shardId,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ShardReady, async (shardId, unavailableGuilds) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ShardReady)) {
				await listener.listener({
					shardId,
					unavailableGuilds,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.ShardResume, async (replayedEvents, shardId) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.ShardResume)) {
				await listener.listener({
					replayedEvents,
					shardId,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.StageInstanceCreate, async (stageInstance) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.StageInstanceCreate)) {
				await listener.listener({
					stageInstance,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(
			Events.StageInstanceUpdate,
			async (oldStageInstance, newStageInstance) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.StageInstanceUpdate
				)) {
					await listener.listener({
						oldStageInstance,
						newStageInstance,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(Events.StageInstanceDelete, async (stageInstance) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.StageInstanceDelete)) {
				await listener.listener({
					stageInstance,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildStickerCreate, async (sticker) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildStickerCreate)) {
				await listener.listener({
					sticker,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(Events.GuildStickerDelete, async (sticker) => {
			const ctx = new Context({ client: this });

			for (const listener of this.getListenersOf(Events.GuildStickerDelete)) {
				await listener.listener({
					sticker,
					ctx,
					logger: this.getLogger(this.layerReverseMap.get(listener)!),
				});
				if (ctx.shouldStopPropagation) break;
			}
		});
		this.discord.on(
			Events.GuildStickerUpdate,
			async (oldSticker, newSticker) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(Events.GuildStickerUpdate)) {
					await listener.listener({
						oldSticker,
						newSticker,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(
			Events.GuildScheduledEventCreate,
			async (guildScheduledEvent) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.GuildScheduledEventCreate
				)) {
					await listener.listener({
						guildScheduledEvent,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(
			Events.GuildScheduledEventUpdate,
			async (oldGuildScheduledEvent, newGuildScheduledEvent) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.GuildScheduledEventUpdate
				)) {
					await listener.listener({
						oldGuildScheduledEvent,
						newGuildScheduledEvent,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);

		this.discord.on(
			Events.GuildScheduledEventDelete,
			async (guildScheduledEvent) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.GuildScheduledEventDelete
				)) {
					await listener.listener({
						guildScheduledEvent,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(
			Events.GuildScheduledEventUserAdd,
			async (guildScheduledEvent, user) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.GuildScheduledEventUserAdd
				)) {
					await listener.listener({
						guildScheduledEvent,
						user,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
		this.discord.on(
			Events.GuildScheduledEventUserRemove,
			async (guildScheduledEvent, user) => {
				const ctx = new Context({ client: this });

				for (const listener of this.getListenersOf(
					Events.GuildScheduledEventUserRemove
				)) {
					await listener.listener({
						guildScheduledEvent,
						user,
						ctx,
						logger: this.getLogger(this.layerReverseMap.get(listener)!),
					});
					if (ctx.shouldStopPropagation) break;
				}
			}
		);
	}

	private async updateCommands(app: string, token: string) {
		const rest = new REST({ version: "10" }).setToken(token);

		await rest.put(Routes.applicationCommands(app), {
			body: this.commands.map((k) => k.data.toJSON()),
		});

		this.globalLogger.success(
			`Automatically refreshed ${this.commands.length} slash (/) commands!`
		);
	}

	async login({ app, token }: { app: string; token: string }) {
		if (this.options.autoUpdateCommands) {
			await this.updateCommands(app, token);
		}
		return this.discord.login(token);
	}
}

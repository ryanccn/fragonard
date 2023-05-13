import {
	ApplicationCommandPermissionsUpdateData,
	AutoModerationActionExecution,
	AutoModerationRule,
	NonThreadGuildBasedChannel,
	DMChannel,
	TextBasedChannel,
	GuildEmoji,
	GuildAuditLogsEntry,
	Guild,
	GuildBan,
	GuildMember,
	PartialGuildMember,
	Collection,
	Snowflake,
	Invite,
	MessageReaction,
	PartialMessageReaction,
	User,
	PartialUser,
	GuildTextBasedChannel,
	Presence,
	Role,
	AnyThreadChannel,
	ThreadMember,
	PartialThreadMember,
	VoiceState,
	Typing,
	TextChannel,
	NewsChannel,
	VoiceChannel,
	ForumChannel,
	Interaction,
	StageInstance,
	Sticker,
	GuildScheduledEvent,
	Events,
	Message,
	PartialMessage,
	Client,
} from "discord.js";
import { BaseContext } from "./baseContext";

interface EventListenerCallbackData {
	[Events.ApplicationCommandPermissionsUpdate]: {
		data: ApplicationCommandPermissionsUpdateData;
	};
	[Events.AutoModerationActionExecution]: {
		autoModerationActionExecution: AutoModerationActionExecution;
	};
	[Events.AutoModerationRuleCreate]: { autoModerationRule: AutoModerationRule };
	[Events.AutoModerationRuleDelete]: { autoModerationRule: AutoModerationRule };
	[Events.AutoModerationRuleUpdate]: {
		oldAutoModerationRule: AutoModerationRule | null;
		newAutoModerationRule: AutoModerationRule;
	};
	[Events.CacheSweep]: { message: string };
	[Events.ChannelCreate]: { channel: NonThreadGuildBasedChannel };
	[Events.ChannelDelete]: { channel: DMChannel | NonThreadGuildBasedChannel };
	[Events.ChannelPinsUpdate]: { channel: TextBasedChannel; date: Date };
	[Events.ChannelUpdate]: {
		oldChannel: DMChannel | NonThreadGuildBasedChannel;
		newChannel: DMChannel | NonThreadGuildBasedChannel;
	};
	[Events.GuildEmojiCreate]: { emoji: GuildEmoji };
	[Events.GuildEmojiDelete]: { emoji: GuildEmoji };
	[Events.GuildEmojiUpdate]: { oldEmoji: GuildEmoji; newEmoji: GuildEmoji };
	[Events.Error]: { error: Error };
	[Events.GuildAuditLogEntryCreate]: {
		auditLogEntry: GuildAuditLogsEntry;
		guild: Guild;
	};
	[Events.GuildBanAdd]: { ban: GuildBan };
	[Events.GuildBanRemove]: { ban: GuildBan };
	[Events.GuildCreate]: { guild: Guild };
	[Events.GuildDelete]: { guild: Guild };
	[Events.GuildUnavailable]: { guild: Guild };
	[Events.GuildIntegrationsUpdate]: { guild: Guild };
	[Events.GuildMemberAdd]: { member: GuildMember };
	[Events.GuildMemberAvailable]: { member: GuildMember | PartialGuildMember };
	[Events.GuildMemberRemove]: { member: GuildMember | PartialGuildMember };
	[Events.GuildMembersChunk]: {
		members: Collection<Snowflake, GuildMember>;
		guild: Guild;
		data: {
			index: number;
			count: number;
			notFound: unknown[];
			nonce: string | undefined;
		};
	};
	[Events.GuildMemberUpdate]: {
		oldMember: GuildMember | PartialGuildMember;
		newMember: GuildMember;
	};
	[Events.GuildUpdate]: { oldGuild: Guild; newGuild: Guild };
	[Events.InviteCreate]: { invite: Invite };
	[Events.InviteDelete]: { invite: Invite };
	[Events.MessageCreate]: { message: Message };
	[Events.MessageDelete]: { message: Message | PartialMessage };
	[Events.MessageReactionRemoveAll]: {
		message: Message | PartialMessage;
		reactions: Collection<string | Snowflake, MessageReaction>;
	};
	[Events.MessageReactionRemoveEmoji]: {
		reaction: MessageReaction | PartialMessageReaction;
	};
	[Events.MessageBulkDelete]: {
		messages: Collection<Snowflake, Message | PartialMessage>;
		channel: GuildTextBasedChannel;
	};
	[Events.MessageReactionAdd]: {
		reaction: MessageReaction | PartialMessageReaction;
		user: User | PartialUser;
	};
	[Events.MessageReactionRemove]: {
		reaction: MessageReaction | PartialMessageReaction;
		user: User | PartialUser;
	};
	[Events.MessageUpdate]: {
		oldMessage: Message | PartialMessage;
		newMessage: Message | PartialMessage;
	};
	[Events.PresenceUpdate]: {
		oldPresence: Presence | null;
		newPresence: Presence;
	};
	[Events.ClientReady]: { client: Client<true> };
	[Events.Invalidated]: Record<string, never>;
	[Events.GuildRoleCreate]: { role: Role };
	[Events.GuildRoleDelete]: { role: Role };
	[Events.GuildRoleUpdate]: { oldRole: Role; newRole: Role };
	[Events.ThreadCreate]: { thread: AnyThreadChannel; newlyCreated: boolean };
	[Events.ThreadDelete]: { thread: AnyThreadChannel };
	[Events.ThreadListSync]: {
		threads: Collection<Snowflake, AnyThreadChannel>;
		guild: Guild;
	};
	[Events.ThreadMemberUpdate]: {
		oldMember: ThreadMember;
		newMember: ThreadMember;
	};
	[Events.ThreadMembersUpdate]: {
		addedMembers: Collection<Snowflake, ThreadMember>;
		removedMembers: Collection<Snowflake, ThreadMember | PartialThreadMember>;
		thread: AnyThreadChannel;
	};
	[Events.ThreadUpdate]: {
		oldThread: AnyThreadChannel;
		newThread: AnyThreadChannel;
	};
	[Events.TypingStart]: { typing: Typing };
	[Events.UserUpdate]: { oldUser: User | PartialUser; newUser: User };
	[Events.VoiceStateUpdate]: { oldState: VoiceState; newState: VoiceState };
	[Events.WebhooksUpdate]: {
		channel: TextChannel | NewsChannel | VoiceChannel | ForumChannel;
	};
	[Events.InteractionCreate]: { interaction: Interaction };
	[Events.ShardDisconnect]: { closeEvent: CloseEvent; shardId: number };
	[Events.ShardError]: { error: Error; shardId: number };
	[Events.ShardReady]: {
		shardId: number;
		unavailableGuilds: Set<Snowflake> | undefined;
	};
	[Events.ShardReconnecting]: { shardId: number };
	[Events.ShardResume]: { shardId: number; replayedEvents: number };
	[Events.StageInstanceCreate]: { stageInstance: StageInstance };
	[Events.StageInstanceUpdate]: {
		oldStageInstance: StageInstance | null;
		newStageInstance: StageInstance;
	};
	[Events.StageInstanceDelete]: { stageInstance: StageInstance };
	[Events.GuildStickerCreate]: { sticker: Sticker };
	[Events.GuildStickerDelete]: { sticker: Sticker };
	[Events.GuildStickerUpdate]: { oldSticker: Sticker; newSticker: Sticker };
	[Events.GuildScheduledEventCreate]: {
		guildScheduledEvent: GuildScheduledEvent;
	};
	[Events.GuildScheduledEventUpdate]: {
		oldGuildScheduledEvent: GuildScheduledEvent | null;
		newGuildScheduledEvent: GuildScheduledEvent;
	};
	[Events.GuildScheduledEventDelete]: {
		guildScheduledEvent: GuildScheduledEvent;
	};
	[Events.GuildScheduledEventUserAdd]: {
		guildScheduledEvent: GuildScheduledEvent;
		user: User;
	};
	[Events.GuildScheduledEventUserRemove]: {
		guildScheduledEvent: GuildScheduledEvent;
		user: User;
	};
}

export type EventListenerSupportedEvents = keyof EventListenerCallbackData;

export type EventListener<E extends EventListenerSupportedEvents> = {
	event: E;
	listener: (
		data: EventListenerCallbackData[E] & BaseContext
	) => void | Promise<void>;
};

type LayerListenerIntermediary = {
	[K in EventListenerSupportedEvents]: EventListener<K>;
};

export type LayerListener =
	LayerListenerIntermediary[keyof LayerListenerIntermediary];

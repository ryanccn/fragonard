import { Events, Message, PartialMessage } from "discord.js";
import { Client } from "~/client";
import { Context } from "~/context";

interface EventListenerCallbackData {
	[Events.MessageCreate]: { message: Message };
	[Events.MessageDelete]: { message: Message | PartialMessage };
}

export type EventListenerSupportedEvents = keyof EventListenerCallbackData;

export type EventListener<E extends EventListenerSupportedEvents> = {
	event: E;
	listener: (
		data: EventListenerCallbackData[E] & {
			ctx: Context;
			client: Client;
		}
	) => void | Promise<void>;
};

export type LayerListener =
	| EventListener<Events.MessageCreate>
	| EventListener<Events.MessageDelete>;

import { Events, Message, PartialMessage } from "discord.js";
import { ConsolaInstance } from "consola";

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
			logger: ConsolaInstance;
		}
	) => void | Promise<void>;
};

export type LayerListener =
	| EventListener<Events.MessageCreate>
	| EventListener<Events.MessageDelete>;

export type LayerListeners = LayerListener[];

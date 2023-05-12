import { Events, Message, PartialMessage } from "discord.js";
import { BaseContext } from "./baseContext";

interface EventListenerCallbackData {
	[Events.MessageCreate]: { message: Message };
	[Events.MessageDelete]: { message: Message | PartialMessage };
}

export type EventListenerSupportedEvents = keyof EventListenerCallbackData;

export type EventListener<E extends EventListenerSupportedEvents> = {
	event: E;
	listener: (
		data: EventListenerCallbackData[E] & BaseContext
	) => void | Promise<void>;
};

export type LayerListener =
	| EventListener<Events.MessageCreate>
	| EventListener<Events.MessageDelete>;

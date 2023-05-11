import { Events, Message, PartialMessage } from "discord.js";
import { Context } from "./context";
import { Client } from "./client";

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

export interface Layer {
	id: string;
	listeners?: LayerListener[];
	// eslint-disable-next-line @typescript-eslint/ban-types
	api?: { [key: string]: Function };
}

export const defineLayer = <T extends Layer>(layer: T): T => layer;

const trolLayer = defineLayer({
	id: "trolear",
	listeners: [
		{
			event: Events.MessageCreate,
			listener: ({ message, ctx }) => {
				console.log(message);
				ctx.getAPI(trolLayer).moyai();
			},
		},
	],
	api: { moyai: () => "moyai" },
});

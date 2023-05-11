import { Interaction, SlashCommandBuilder } from "discord.js";
import { LayerListener } from "./listener";

export type LayerCommands = {
	data: SlashCommandBuilder;
	handler: (e: Interaction) => void | Promise<void>;
}[];

export interface Layer {
	id: string;
	listeners?: LayerListener[];
	commands?: LayerCommands;
	// eslint-disable-next-line @typescript-eslint/ban-types
	api?: { [key: string]: Function };
}

export const defineLayer = <T extends Layer>(layer: T): T => layer;

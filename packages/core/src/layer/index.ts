import {
	ContextMenuCommandBuilder,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
} from "discord.js";
import { LayerListener } from "./listener";

export interface LayerSlashCommand {
	data: SlashCommandBuilder;
	handler: (interaction: ChatInputCommandInteraction) => void | Promise<void>;
}

export interface LayerContextMenuCommand {
	data: ContextMenuCommandBuilder;
	handler: (interaction: ContextMenuCommandInteraction) => void | Promise<void>;
}

export type LayerCommands = LayerSlashCommand[];

export interface Layer {
	id: string;
	listeners?: LayerListener[];
	commands?: LayerCommands;
	// eslint-disable-next-line @typescript-eslint/ban-types
	api?: { [key: string]: Function };
}

export const defineLayer = <T extends Layer>(layer: T): T => layer;

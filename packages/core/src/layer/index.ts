import {
	ContextMenuCommandBuilder,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
} from "discord.js";
import { LayerListener } from "./listener";

export enum LayerCommandType {
	SlashCommand,
	ContextMenuCommand,
}

export interface LayerSlashCommand {
	type: LayerCommandType.SlashCommand;
	data: SlashCommandBuilder;
	handler: (interaction: ChatInputCommandInteraction) => void | Promise<void>;
}

export interface LayerContextMenuCommand {
	type: LayerCommandType.ContextMenuCommand;
	data: ContextMenuCommandBuilder;
	handler: (interaction: ContextMenuCommandInteraction) => void | Promise<void>;
}

type LayerCommand = LayerSlashCommand | LayerContextMenuCommand;

export type LayerCommands = LayerCommand[];

export interface Layer {
	id: string;
	listeners?: LayerListener[];
	commands?: LayerCommands;
	// eslint-disable-next-line @typescript-eslint/ban-types
	api?: { [key: string]: Function };
}

export const defineLayer = <T extends Layer>(layer: T): T => layer;

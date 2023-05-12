import {
	ChatInputCommandInteraction,
	ContextMenuCommandBuilder,
	ContextMenuCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";

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

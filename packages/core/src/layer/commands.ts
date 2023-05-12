import {
	ChatInputCommandInteraction,
	ContextMenuCommandBuilder,
	ContextMenuCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { BaseContext } from "./baseContext";

export enum LayerCommandType {
	SlashCommand,
	ContextMenuCommand,
}

export interface LayerSlashCommand {
	type: LayerCommandType.SlashCommand;
	data: SlashCommandBuilder;
	handler: (
		data: { interaction: ChatInputCommandInteraction } & BaseContext
	) => void | Promise<void>;
}

export interface LayerContextMenuCommand {
	type: LayerCommandType.ContextMenuCommand;
	data: ContextMenuCommandBuilder;
	handler: (
		data: { interaction: ContextMenuCommandInteraction } & BaseContext
	) => void | Promise<void>;
}

export type LayerCommand = LayerSlashCommand | LayerContextMenuCommand;

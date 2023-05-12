import { ButtonInteraction } from "discord.js";

export interface LayerButton {
	customId: string | RegExp;
	handler: (interaction: ButtonInteraction) => void | Promise<void>;
}

export type LayerButtons = LayerButton[];

import { ButtonInteraction } from "discord.js";
import { BaseContext } from "./baseContext";

export interface LayerButton {
	customId: string | RegExp;
	handler: (
		data: { interaction: ButtonInteraction } & BaseContext
	) => void | Promise<void>;
}

export type LayerButtons = LayerButton[];

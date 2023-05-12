import { LayerCommands } from "./commands";
import { LayerListeners } from "./listeners";

export interface Layer {
	id: string;
	listeners?: LayerListeners;
	commands?: LayerCommands;
	// eslint-disable-next-line @typescript-eslint/ban-types
	api?: { [key: string]: Function };
}

export const defineLayer = <T extends Layer>(layer: T): T => layer;

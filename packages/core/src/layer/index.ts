import { LayerButtons } from "./buttons";
import { LayerCommands } from "./commands";
import { LayerListeners } from "./listeners";

export interface Layer {
	id: string;
	listeners?: LayerListeners;
	commands?: LayerCommands;
	buttons?: LayerButtons;
	// eslint-disable-next-line @typescript-eslint/ban-types
	api?: { [key: string]: Function };
}

export const defineLayer = <T extends Layer>(layer: T): T => layer;

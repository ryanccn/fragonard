import { LayerButton } from "./buttons";
import { LayerCommand } from "./commands";
import { LayerListener } from "./listeners";
import { BaseContext } from "./baseContext";

export type LayerReadyListener = (data: BaseContext) => void | Promise<void>;
export type LayerErrorListener = (
	data: {
		error: Error;
	} & BaseContext
) => void | Promise<void>;

export interface Layer {
	id: string;

	onReady?: LayerReadyListener;
	onError?: LayerErrorListener;

	listeners?: LayerListener[];
	commands?: LayerCommand[];
	buttons?: LayerButton[];

	// eslint-disable-next-line @typescript-eslint/ban-types
	api?: { [key: string]: Function };
}

export const defineLayer = <T extends Layer>(layer: T): T => layer;

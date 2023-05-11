import { Client } from "~/client";
import { Layer } from "~/layer";

export class Context {
	private client: Client;
	shouldStopPropagation = false;

	constructor({ client }: { client: Client }) {
		this.client = client;
	}

	stopPropagation() {
		this.shouldStopPropagation = true;
	}

	getAPI<T extends Layer>(layer: T): T["api"] {
		const api = this.safeGetAPI(layer);
		if (!api)
			throw new Error(
				`No API found for layer ${layer.id}. Is it initialized or does it provide an API?`
			);

		return api;
	}

	safeGetAPI<T extends Layer>(layer: T): T["api"] | null {
		const clientLayer = this.client.layers.find((l) => l.id === layer.id);
		if (!clientLayer || !clientLayer.api) return null;
		return clientLayer.api;
	}
}

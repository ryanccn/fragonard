// import { Client } from "~/client";
import { Context } from "~/context";
import { ConsolaInstance } from "consola";

export interface BaseContext {
	ctx: Context;
	logger: ConsolaInstance;
}

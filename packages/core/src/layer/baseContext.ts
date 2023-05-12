// import { Client } from "~/client";
import { Context } from "~/context";
import { Logger } from "~/logger";

export interface BaseContext {
	ctx: Context;
	logger: Logger;
}

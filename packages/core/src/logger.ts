import { cyan, dim, green, red, yellow } from "kleur/colors";

export class Logger {
	private readonly identifier?: string;

	constructor(identifier?: string) {
		this.identifier = identifier;
	}

	info(...items: unknown[]) {
		const prefix = `${cyan("info")}${
			this.identifier ? dim(`[${this.identifier}]`) : ""
		} ${dim("-")}`;

		console.log(prefix, ...items);
	}

	warn(...items: unknown[]) {
		const prefix = `${yellow("warn")}${
			this.identifier ? dim(`[${this.identifier}]`) : ""
		} ${dim("-")}`;

		console.error(prefix, ...items);
	}

	error(...items: unknown[]) {
		const prefix = `${red("error")}${
			this.identifier ? dim(`[${this.identifier}]`) : ""
		} ${dim("-")}`;

		console.error(prefix, ...items);
	}

	success(...items: unknown[]) {
		const prefix = `${green("success")}${
			this.identifier ? dim(`[${this.identifier}]`) : ""
		} ${dim("-")}`;

		console.error(prefix, ...items);
	}
}

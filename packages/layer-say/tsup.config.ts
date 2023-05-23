import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	clean: true,
	minify: false,
	dts: true,
	format: ["cjs", "esm"],
});

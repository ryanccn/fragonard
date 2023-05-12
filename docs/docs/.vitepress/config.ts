import { defineConfig } from "vitepress";

// https://vitepress.vuejs.org/config/app-configs
export default defineConfig({
	title: "Fragonard",
	description: "A modular, extensible Discord bot framework.",
	themeConfig: {
		nav: [{ text: "Getting Started", link: "/getting-started" }],
		socialLinks: [
			{ icon: "github", link: "https://github.com/ryanccn/fragonard" },
			{ icon: "discord", link: "https://discord.gg/ty7GCnN87U" },
		],
	},
});

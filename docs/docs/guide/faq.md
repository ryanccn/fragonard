# Frequently asked questions

Here lies answers to some frequently asked questions about Fragonard.

## Does this replace [Discord.js](https://discord.js.org/)?

No. This builds on top of Discord.js's APIs, and many of the APIs you will be using are still from Discord.js. Fragonard provides an overarching framework for organizing your bot's codebase and improves reusability.

## Isn't this just [Sapphire](https://www.sapphirejs.dev/)?

In some ways, Fragonard is similar to Sapphire, but Fragonard has a cleaner and more convenient API compared to Sapphire, where there is lots of boilerplate. Sapphire is an older and more established framework, though.

## Can I publish layers to npm?

Yes, absolutely! One intention for the reusability of layers is for some of them to be published on npm for others to use. In fact, we ourselves provide [some official layers](https://www.npmjs.com/org/fragonard) within the Fragonard organization.

## Is TypeScript required to use this?

No. TypeScript provides better developer experience, but if you don't want to use it, you don't have to. We provide both ES module and CommonJS exports, and IntelliSense will still provide you with some autocomplete from our type definitions even if you do not use TypeScript yourself.

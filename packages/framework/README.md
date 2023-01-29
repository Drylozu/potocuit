# @potoland/framework

Classes, functions and main structures to create an application with biscuit.
Core contains the essentials to launch you to develop your own customized and
scalable bot.

[<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white">](https://github.com/potoland/potocuit)
[<img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white">](https://discord.gg/XNw2RZFzaP)

## Getting Started

### Install (for [node18](https://nodejs.org/en/download/))

```sh-session
npm install @potoland/framework
yarn add @potoland/framework
```

### Example bot

`project/index.js`:

```js
import { Session } from "@potoland/framework";
import { GatewayIntents } from "@potoland/api-types";

const session = new Session({
  token: "your token",
  intents: GatewayIntents.Guilds,
});

const commands = [
  {
    name: "ping",
    description: "Replies with pong!",
  },
];

session.events.on("ready", ({ user }) => {
  console.log("Logged in as:", user.tag);
  session.upsertApplicationCommands(commands, "GUILD_ID");
});

session.events.on("interactionCreate", (interaction) => {
  if (interaction.isCommand()) {
    // your commands go here
    if (interaction.commandName === "ping") {
      interaction.respondWith({ content: "pong!" });
    }
  }
});

session.start();
```

### Execute

For node 18.+:

```
B:\project> node index.js
```

For node 16.+:

```
B:\project> node --experimental-fetch index.js
```

## Links

- [Website](https://biscuitjs.com/)
- [Documentation](https://docs.biscuitjs.com/)
- [Discord](https://discord.gg/XNw2RZFzaP)
- [api-types](https://www.npmjs.com/package/@potoland/api-types) |
  [cache](https://www.npmjs.com/package/@potoland/cache) |
  [rest](https://www.npmjs.com/package/@potoland/rest) |
  [ws](https://www.npmjs.com/package/@potoland/ws) |
  [helpers](https://www.npmjs.com/package/@potoland/helpers)

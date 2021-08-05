import { Client } from "discord.js";

import { makeCommandHandler, makeCommands } from "./command-handler";
import { ServerService } from "./server-service";

const service = new ServerService();
const commandsPromise = makeCommands(service);

const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES"],
});

const GUILD_ID = process.env.GUILD_ID;
if (GUILD_ID === undefined) {
  console.error("Expected GUILD_ID environment variable to be set");
  process.exit(2);
}

client.on("ready", async () => {
  const guild = await client.guilds.fetch(GUILD_ID);
  await guild.commands.set(await commandsPromise);
  console.log("Commands set");
});

client.on("interactionCreate", makeCommandHandler(service));

client.on("error", (error) => {
  console.error("Caught client error");
  console.error(error);
  process.exit(1);
});

client.login();

process.on("beforeExit", () => {
  console.log("Exiting");
  client.destroy();
});

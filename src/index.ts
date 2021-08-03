import { Client } from "discord.js";

import { makeCommandHandler, makeCommands } from "./command-handler";
import { ServerService } from "./server-service";

const service = new ServerService();

const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES"],
});

client.on("ready", async () => {
  await client.application!.commands.set(await makeCommands(service));
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

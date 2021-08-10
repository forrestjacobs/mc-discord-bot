import { Client, Guild } from "discord.js";

import { makeCommandHandler, makeCommands } from "./command-handler";
import { ServerService } from "./server-service";

const service = new ServerService();

const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES"],
});

const GUILD_ID = process.env.GUILD_ID;
if (GUILD_ID === undefined) {
  console.error("Expected GUILD_ID environment variable to be set");
  process.exit(2);
}

async function registerCommands(guild: Guild): Promise<void> {
  await guild.commands.set(await makeCommands(service));
  console.log("Commands set");
}

client.on("ready", async () => {
  const guild = await client.guilds.fetch(GUILD_ID);
  await registerCommands(guild);
  service.addStartCallback(() => {
    registerCommands(guild);
  });
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

import { Client } from "discord.js";

import { makeMessageHandler } from "./message-handler";
import { ServerService } from "./server-service";

const client = new Client();

client.on("ready", async () => {
  const botUser = client.user;
  if (botUser === null) {
    console.error("client.user is null");
    process.exit(2);
  }

  console.log(`Logged in as ${botUser.tag}`);

  const serverService = new ServerService();

  client.on(
    "message",
    makeMessageHandler({
      botUserId: botUser.id,
      serverService: serverService,
    })
  );
});

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

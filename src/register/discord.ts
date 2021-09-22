import { Response } from "node-fetch";

import { discordFetch } from "../common/discord";
import { getEnv } from "../common/env";
import { Command } from "./types";

const APPLICATION_ID = getEnv("APPLICATION_ID");
const DISCORD_TOKEN = getEnv("DISCORD_TOKEN");
const GUILD_ID = getEnv("GUILD_ID");

export function overwriteCommands(commands: Command[]): Promise<Response> {
  return discordFetch(
    `/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${DISCORD_TOKEN}`,
      },
      body: JSON.stringify(commands),
    }
  );
}

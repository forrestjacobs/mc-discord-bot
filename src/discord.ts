import { Request } from "express";
import fetch, { Response } from "node-fetch";
import { sign } from "tweetnacl";

export type PingInteraction = {
  type: 1;
};

export type CommandInteraction = {
  type: 2;
  data: {
    options: [
      {
        name: string;
        type: number;
        options?: {
          name: string;
          type: number;
          value: string;
        }[];
      }
    ];
  };
  token: string;
};

export type Interaction = PingInteraction | CommandInteraction;

export type InteractionResponse = {
  type: number;
  data?: {
    content: string;
  };
};

export type SubCommand = {
  description: string;
  name: string;
  type: number;
  options?: Array<{
    name: string;
    type: number;
    description: string;
    required: boolean;
    choices: Array<{
      name: string;
      value: string;
    }>;
  }>;
};

export type Command = {
  name: string;
  description: string;
  type: number;
  options: SubCommand[];
};

const DISCORD_URL = "https://discord.com/api/v8";

const APPLICATION_ID = process.env.APPLICATION_ID;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
if (
  APPLICATION_ID == undefined ||
  PUBLIC_KEY === undefined ||
  DISCORD_TOKEN == undefined ||
  GUILD_ID === undefined
) {
  console.error("Expected environment variables to be set");
  process.exit(2);
}
const publicKeyHex = Buffer.from(PUBLIC_KEY, "hex");

export function verifyRequest(req: Request): boolean {
  const signature = req.get("X-Signature-Ed25519");
  const timestamp = req.get("X-Signature-Timestamp");
  const body: string | undefined = req.body;
  return (
    signature !== undefined &&
    timestamp !== undefined &&
    body !== undefined &&
    sign.detached.verify(
      Buffer.from(`${timestamp}${body}`),
      Buffer.from(signature, "hex"),
      publicKeyHex
    )
  );
}

async function logResponse(label: string, response: Response) {
  console.log(`${label} status:`, response.status);
  console.log(`${label} response:`, await response.json());
}

export async function followUp(
  interaction: CommandInteraction,
  content: string
): Promise<void> {
  await logResponse(
    "Follow up",
    await fetch(
      `${DISCORD_URL}/webhooks/${APPLICATION_ID}/${interaction.token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      }
    )
  );
}

export async function overwriteCommands(commands: Command[]): Promise<void> {
  await logResponse(
    "Overwrite commands",
    await fetch(
      `${DISCORD_URL}/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${DISCORD_TOKEN}`,
        },
        body: JSON.stringify(commands),
      }
    )
  );
}

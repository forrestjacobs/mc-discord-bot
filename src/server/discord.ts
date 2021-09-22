import { Request } from "express";
import { Response } from "node-fetch";
import { sign } from "tweetnacl";

import { discordFetch } from "../common/discord";
import { getEnv } from "../common/env";
import { CommandInteraction } from "./types";

const APPLICATION_ID = getEnv("APPLICATION_ID");
const publicKeyHex = Buffer.from(getEnv("PUBLIC_KEY"), "hex");

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

export async function followUp(
  interaction: CommandInteraction,
  content: string
): Promise<Response> {
  return discordFetch(`/webhooks/${APPLICATION_ID}/${interaction.token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
    }),
  });
}

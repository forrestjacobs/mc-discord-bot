import { IncomingMessage } from "http";
import { Response } from "node-fetch";
import { sign } from "tweetnacl";

import { discordFetch } from "../common/discord";
import { getEnv } from "../common/env";
import { CommandInteraction } from "./types";

const APPLICATION_ID = getEnv("APPLICATION_ID");
const publicKeyHex = Buffer.from(getEnv("PUBLIC_KEY"), "hex");

export function verifyRequest(body: string, req: IncomingMessage): boolean {
  const signature = req.headers["X-Signature-Ed25519"];
  const timestamp = req.headers["X-Signature-Timestamp"];
  return (
    typeof signature === "string" &&
    typeof timestamp === "string" &&
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

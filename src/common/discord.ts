import fetch, { RequestInit, Response } from "node-fetch";

const DISCORD_URL = "https://discord.com/api/v8";

export async function discordFetch(
  path: string,
  init: RequestInit
): Promise<Response> {
  const url = `${DISCORD_URL}${path}`;
  const response = await fetch(url, init);

  const method = init.method ?? "GET";
  console.log(`${method} ${url} status:`, response.status);
  console.log(`${method} ${url} response:`, await response.json());

  return response;
}

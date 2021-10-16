import { query, QueryResult } from "gamedig";

import { getEnv } from "./env";
import {
  getActiveEnterTimestampMonotonic,
  isActive,
  start,
  stop,
} from "./systemd";

export const WORLD_UNIT_PREFIX = "mc-world-";

export function getWorlds(): string[] {
  return getEnv("WORLDS").split(",");
}

export function getRunningWorld(worlds: string[]): Promise<string | null> {
  return Promise.any(
    worlds.map(async (w) =>
      (await isActive(`${WORLD_UNIT_PREFIX}${w}`)) ? w : Promise.reject()
    )
  ).catch(() => null);
}

export function queryServer(): Promise<QueryResult> {
  return query({
    type: "minecraft",
    host: "localhost",
  });
}

export function startWorld(world: string): Promise<void> {
  return start(`${WORLD_UNIT_PREFIX}${world}`);
}

export function stopWorld(world: string): Promise<void> {
  return stop(`${WORLD_UNIT_PREFIX}${world}`);
}

export async function getWorldStart(world: string): Promise<bigint | null> {
  return getActiveEnterTimestampMonotonic(`${WORLD_UNIT_PREFIX}${world}`);
}

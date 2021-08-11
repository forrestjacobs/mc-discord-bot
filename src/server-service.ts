import { mkdir, open, stat } from "fs/promises";
import { query, QueryResult } from "gamedig";

import {
  isActive,
  listServiceUnitFiles,
  start as startUnit,
  stop as stopUnit,
} from "./systemd";
import { keepTrying } from "./wait";

const WORLD_UNIT_PREFIX = "mc-world-";
const WORLD_ORDER_PATH = "/var/lib/mc-discord-bot/world-order/";

function queryServer(): Promise<QueryResult> {
  return query({
    type: "minecraft",
    host: "localhost",
  });
}

export class ServerService {
  #locked = false;
  #startCallbacks: Array<() => void> = [];

  get locked(): boolean {
    return this.#locked;
  }

  async #lock(fn: () => Promise<void>): Promise<void> {
    if (this.locked) {
      throw new Error("Service is locked");
    }
    try {
      this.#locked = true;
      await fn();
    } finally {
      this.#locked = false;
    }
  }

  addStartCallback(callback: () => void): void {
    this.#startCallbacks.push(callback);
  }

  async #getWorldSet(): Promise<Set<string>> {
    const services = await listServiceUnitFiles(`${WORLD_UNIT_PREFIX}*`);
    return new Set(services.map((s) => s.substring(WORLD_UNIT_PREFIX.length)));
  }

  async getWorlds(): Promise<string[]> {
    const worldsWithMtime = await Promise.all(
      Array.from(await this.#getWorldSet()).map((world) =>
        stat(`${WORLD_ORDER_PATH}${world}`)
          .then((stat) => stat.mtimeMs)
          .catch(() => 0)
          .then((mtime) => ({
            world,
            mtime,
          }))
      )
    );
    worldsWithMtime.sort((a, b) => b.mtime - a.mtime);
    return worldsWithMtime.map((x) => x.world);
  }

  async #getRunningWorld(): Promise<string | undefined> {
    return Promise.any(
      Array.from(await this.#getWorldSet()).map(async (w) =>
        (await isActive(`${WORLD_UNIT_PREFIX}${w}`)) ? w : Promise.reject()
      )
    ).catch(() => undefined);
  }

  async getStatus(): Promise<
    | { world: string; players: Array<string | undefined>; maxPlayers: number }
    | undefined
  > {
    const world = await this.#getRunningWorld();
    if (world === undefined) {
      return undefined;
    }
    const { players, maxplayers } = await queryServer();
    return {
      world,
      players: players.map((player) => player.name).sort(),
      maxPlayers: maxplayers,
    };
  }

  async start(world: string): Promise<void> {
    await this.#lock(async () => {
      const worlds = await this.#getWorldSet();
      if (!worlds.has(world)) {
        throw new Error(`"${world}" is not a Minecraft world`);
      }

      await startUnit(`${WORLD_UNIT_PREFIX}${world}`);
      await keepTrying(500, 120000, () => queryServer());

      await mkdir(WORLD_ORDER_PATH, { recursive: true });
      const handler = await open(`${WORLD_ORDER_PATH}${world}`, "a");
      try {
        const now = new Date();
        await handler.utimes(now, now);
      } finally {
        await handler.close();
      }
    });
    for (const callback of this.#startCallbacks) {
      callback();
    }
  }

  stop(): Promise<void> {
    return this.#lock(async () => {
      const world = await this.#getRunningWorld();
      if (world !== undefined) {
        await stopUnit(`${WORLD_UNIT_PREFIX}${world}`);
      }
    });
  }
}

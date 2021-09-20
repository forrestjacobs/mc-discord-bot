import { query, QueryResult } from "gamedig";

import { getMtime, updateMtime } from "./mtime";
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
        getMtime(`${WORLD_ORDER_PATH}${world}`).then((mtime) => ({
          world,
          mtime,
        }))
      )
    );
    worldsWithMtime.sort((a, b) => b.mtime - a.mtime);
    return worldsWithMtime.map((x) => x.world);
  }

  async getStatus(): Promise<
    { world: string; numPlayers: number } | undefined
  > {
    const world = await Promise.any(
      Array.from(await this.#getWorldSet()).map(async (w) =>
        (await isActive(`${WORLD_UNIT_PREFIX}${w}`)) ? w : Promise.reject()
      )
    ).catch(() => undefined);
    if (world === undefined) {
      return undefined;
    }
    const { players } = await queryServer();
    return {
      world,
      numPlayers: players.length,
    };
  }

  start(world: string): Promise<void> {
    return this.#lock(async () => {
      const worlds = await this.#getWorldSet();
      if (!worlds.has(world)) {
        throw new Error(`"${world}" is not a Minecraft world`);
      }

      await startUnit(`${WORLD_UNIT_PREFIX}${world}`);
      await keepTrying(500, 120000, () => queryServer());

      await updateMtime(`${WORLD_ORDER_PATH}${world}`);
      for (const callback of this.#startCallbacks) {
        callback();
      }
    });
  }

  stop(): Promise<void> {
    return this.#lock(async () => {
      const status = await this.getStatus();
      if (status === undefined) {
        throw new Error("World is not running");
      }
      if (status.numPlayers !== 0) {
        throw new Error("Players are online");
      }
      await stopUnit(`${WORLD_UNIT_PREFIX}${status.world}`);
    });
  }
}

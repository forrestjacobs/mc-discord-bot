import { query, QueryResult } from "gamedig";

import { isActive, start as startUnit, stop as stopUnit } from "./systemd";
import { keepTrying } from "./wait";

const WORLD_UNIT_PREFIX = "mc-world-";

function queryServer(): Promise<QueryResult> {
  return query({
    type: "minecraft",
    host: "localhost",
  });
}

export class ServerService {
  #locked = false;
  readonly worlds: string[];

  constructor(worlds: string[]) {
    this.worlds = worlds;
  }

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

  async getStatus(): Promise<{ world: string; numPlayers: number } | null> {
    const world = await Promise.any(
      this.worlds.map(async (w) =>
        (await isActive(`${WORLD_UNIT_PREFIX}${w}`)) ? w : Promise.reject()
      )
    ).catch(() => null);
    if (world === null) {
      return null;
    }
    const { players } = await queryServer();
    return {
      world,
      numPlayers: players.length,
    };
  }

  start(world: string): Promise<void> {
    return this.#lock(async () => {
      if (this.worlds.indexOf(world) === -1) {
        throw new Error(`"${world}" is not a Minecraft world`);
      }

      await startUnit(`${WORLD_UNIT_PREFIX}${world}`);
      await keepTrying(500, 120000, () => queryServer());
    });
  }

  stop(): Promise<void> {
    return this.#lock(async () => {
      const status = await this.getStatus();
      if (status === null) {
        throw new Error("World is not running");
      }
      if (status.numPlayers !== 0) {
        throw new Error("Players are online");
      }
      await stopUnit(`${WORLD_UNIT_PREFIX}${status.world}`);
    });
  }
}

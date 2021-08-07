import { query, QueryResult } from "gamedig";

import {
  isActive,
  listServiceUnitFiles,
  start as startUnit,
  stop as stopUnit,
} from "./systemd";
import { keepTrying } from "./wait";

const WORLD_UNIT_PREFIX = "mc-world-";

function queryServer(): Promise<QueryResult> {
  return query({
    type: "minecraft",
    host: "localhost",
  });
}

export class ServerService {
  locked = false;

  private async lock(fn: () => Promise<void>): Promise<void> {
    if (this.locked) {
      throw new Error("Service is locked");
    }
    try {
      this.locked = true;
      await fn();
    } finally {
      this.locked = false;
    }
  }

  async getWorlds(): Promise<string[]> {
    const services = await listServiceUnitFiles(`${WORLD_UNIT_PREFIX}*`);
    return services.map((s) => s.substring(WORLD_UNIT_PREFIX.length));
  }

  async #getRunningWorld(): Promise<string | undefined> {
    const worlds = await this.getWorlds();
    return Promise.any(
      worlds.map(async (w) =>
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

  start(world: string): Promise<void> {
    return this.lock(async () => {
      await startUnit(`${WORLD_UNIT_PREFIX}${world}`);
      await keepTrying(500, 120000, () => queryServer());
    });
  }

  stop(): Promise<void> {
    return this.lock(async () => {
      const world = this.#getRunningWorld();
      if (world !== undefined) {
        await stopUnit(`${WORLD_UNIT_PREFIX}${world}`);
      }
    });
  }
}

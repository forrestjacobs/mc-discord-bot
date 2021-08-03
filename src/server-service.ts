import { query } from "gamedig";

import {
  isActive,
  listServiceUnitFiles,
  start as startUnit,
  stop as stopUnit,
} from "./systemd";
import { keepTrying } from "./wait";

const WORLD_UNIT_PREFIX = "mc-world-";

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

  async getRunningWorlds(): Promise<string[]> {
    const worlds = await this.getWorlds();
    const running = await Promise.all(
      worlds.map((w) => isActive(`${WORLD_UNIT_PREFIX}${w}`))
    );
    return worlds.filter((_, i) => running[i]);
  }

  start(world: string): Promise<void> {
    return this.lock(async () => {
      await startUnit(`${WORLD_UNIT_PREFIX}${world}`);
      await keepTrying(500, 120000, () =>
        query({
          type: "minecraft",
          host: "localhost",
        })
      );
    });
  }

  stop(): Promise<void> {
    return this.lock(async () => {
      for (const world of await this.getRunningWorlds()) {
        await stopUnit(`${WORLD_UNIT_PREFIX}${world}`);
      }
    });
  }
}

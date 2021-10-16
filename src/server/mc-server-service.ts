import {
  getRunningWorld,
  queryServer,
  startWorld,
  stopWorld,
} from "../common/worlds";
import { keepTrying } from "./wait";

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
    const world = await getRunningWorld(this.worlds);
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

      await startWorld(world);
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
      await stopWorld(status.world);
    });
  }
}

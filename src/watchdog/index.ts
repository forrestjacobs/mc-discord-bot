import { exit } from "process";

import {
  getRunningWorld,
  getWorlds,
  getWorldStart,
  queryServer,
  stopWorld,
} from "../common/worlds";

const TTL = 30 * 60 * 1000; // 30 minutes in ms
const CHECK_INTERVAL = 15 * 1000; // 15 seconds in ms

async function iter(
  world: string,
  expectedStart: bigint,
  endDate: number
): Promise<boolean> {
  const now = Date.now();

  const start = await getWorldStart(world);
  if (start !== expectedStart) {
    console.log(`Exiting because of unexpected start date: ${start}`);
    return true;
  }

  const { players } = await queryServer();
  if (players.length > 0) {
    console.log(`Exiting because there are ${players.length} online`);
    return true;
  }

  if (now > endDate) {
    console.log("Stopping the world");
    await stopWorld(world);
    return true;
  }

  return false;
}

async function start() {
  const world = await getRunningWorld(getWorlds());
  if (world === null) {
    console.log("Exiting because no world is running");
    return;
  }

  const start = await getWorldStart(world);
  if (start === null) {
    console.log("Exiting because the world does not have a start date");
    return;
  }

  const endDate = Date.now() + TTL;
  console.log(`${world} is running with start date ${start}`);
  console.log(`Stopping at ${endDate} if no one logs in`);

  let locked = false;
  setInterval(async () => {
    if (locked) {
      return;
    }

    locked = true;
    try {
      if (await iter(world, start, endDate)) {
        exit(0);
      }
    } catch (e) {
      console.error("Could not check Minecraft service", e);
      exit(2);
    }
    locked = false;
  }, CHECK_INTERVAL);
}

start().catch((e) => {
  console.error("Could not start", e);
  exit(1);
});

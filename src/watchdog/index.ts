import { exit } from "process";
import { setTimeout } from "timers";

import {
  getRunningWorld,
  getWorlds,
  getWorldStart,
  queryServer,
  stopWorld,
} from "../common/worlds";

const TTL = 30 * 60 * 1000; // 30 minutes in ms
const CHECK_INTERVAL = 15 * 1000; // 15 seconds in ms

async function shouldExit(
  world: string,
  expectedStart: bigint,
  endDate: number
): Promise<boolean> {
  const now = Date.now();
  console.log(`Checking ${world}`);

  const start = await getWorldStart(world);
  if (start !== expectedStart) {
    console.log(`Exiting because ${world} has stopped or restarted`);
    return true;
  }

  const { players } = await queryServer();
  if (players.length > 0) {
    console.log(`Exiting because ${world} has ${players.length} player(s)`);
    return true;
  }

  if (now > endDate) {
    console.log(`Stopping ${world}`);
    await stopWorld(world);
    return true;
  }

  return false;
}

async function iter(world: string, start: bigint, endDate: number) {
  try {
    if (await shouldExit(world, start, endDate)) {
      exit(0);
    }
  } catch (e) {
    console.error("Could not check Minecraft service", e);
    exit(2);
  }

  setTimeout(() => iter(world, start, endDate), CHECK_INTERVAL);
}

async function start() {
  const world = await getRunningWorld(getWorlds());
  if (world === null) {
    console.log("Exiting because no world is running");
    return;
  }

  const start = await getWorldStart(world);
  if (start === null) {
    console.log(`Exiting because ${world} does not have a start date`);
    return;
  }

  const endDate = Date.now() + TTL;
  const formattedEndDate = new Date(endDate).toLocaleString();
  console.log(`Will stop ${world} at ${formattedEndDate} if no one logs in`);

  iter(world, start, endDate);
}

start().catch((e) => {
  console.error("Could not start", e);
  exit(1);
});

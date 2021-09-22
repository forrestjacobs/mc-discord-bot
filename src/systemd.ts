import { execFile } from "./child-process";

export async function start(unit: string): Promise<void> {
  await execFile("systemctl", ["start", unit]);
}

export async function stop(unit: string): Promise<void> {
  await execFile("systemctl", ["stop", unit]);
}

export async function isActive(unit: string): Promise<boolean> {
  try {
    await execFile("systemctl", ["is-active", unit]);
    return true;
  } catch (_) {
    return false;
  }
}

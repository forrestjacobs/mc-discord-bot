import { SocketConstructorOpts } from "net";

import { execFile } from "./child-process";

export function getFileDescriptor(): SocketConstructorOpts | null {
  const fds = process.env.LISTEN_FDS;
  return fds !== undefined && parseInt(fds, 10) > 0 ? { fd: 3 } : null;
}

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

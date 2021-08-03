import { execFile } from "./child-process";

const UNIT_REGEXP = /[\w\-.:\\]*\.service/g;

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

export async function listServiceUnitFiles(pattern: string): Promise<string[]> {
  const { stdout } = await execFile("systemctl", [
    "list-unit-files",
    "--type=service",
    pattern,
  ]);

  const services = stdout.match(UNIT_REGEXP) ?? [];
  return services.map((s) => s.substring(0, s.length - 8)); // remove .service
}

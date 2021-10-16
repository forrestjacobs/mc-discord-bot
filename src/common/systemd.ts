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

async function getProperty(
  unit: string,
  property: string
): Promise<string | null> {
  try {
    const { stdout } = await execFile("systemctl", [
      "show",
      unit,
      `--property=${property}`,
    ]);
    const equalIndex = stdout.indexOf("=");
    return stdout.substring(equalIndex + 1).trimEnd();
  } catch (_) {
    return null;
  }
}

export async function getActiveEnterTimestampMonotonic(
  unit: string
): Promise<bigint | null> {
  const start = await getProperty(unit, "ActiveEnterTimestampMonotonic");
  return start === null || start === "0" ? null : BigInt(start);
}

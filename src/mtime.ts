import { mkdir, open, stat } from "fs/promises";
import { dirname } from "path";

export async function getMtime(path: string): Promise<number> {
  try {
    const s = await stat(path);
    return s.mtimeMs;
  } catch (_) {
    return 0;
  }
}

export async function updateMtime(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handler = await open(path, "a");
  try {
    const now = new Date();
    await handler.utimes(now, now);
  } finally {
    await handler.close();
  }
}

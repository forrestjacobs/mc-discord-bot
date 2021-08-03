import { execFile as rawExecFile } from "child_process";
import { promisify } from "util";

export const execFile: (
  file: string,
  args: readonly string[]
) => Promise<{
  stdout: string;
  stderr: string;
}> = promisify(rawExecFile);

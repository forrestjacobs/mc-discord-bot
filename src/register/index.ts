import { getWorlds } from "../common/worlds";
import { makeCommand } from "./command";
import { overwriteCommands } from "./discord";

async function registerCommands(): Promise<void> {
  const worlds = getWorlds();
  const command = makeCommand(worlds);
  await overwriteCommands([command]);
  console.log("Commands set");
}

registerCommands();

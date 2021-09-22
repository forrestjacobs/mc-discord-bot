import { Command } from "./types";

function makeNamedValue<S extends string, T extends number>(
  name: S,
  type: T,
  description: string
): { name: S; type: T; description: string } {
  return {
    name,
    type,
    description,
  };
}

export function makeCommand(worlds: string[]): Command {
  return {
    ...makeNamedValue("mc", 1, "Controls the Minecraft server"),
    options: [
      {
        ...makeNamedValue("start", 1, "Starts the Minecraft server"),
        options: [
          {
            ...makeNamedValue("world", 3, "The world to start"),
            required: true,
            choices: worlds.map((world) => ({
              name: world,
              value: world,
            })),
          },
        ],
      },
      makeNamedValue("stop", 1, "Stops the Minecraft server"),
      makeNamedValue("status", 1, "Gets the status of the Minecraft server"),
    ],
  };
}

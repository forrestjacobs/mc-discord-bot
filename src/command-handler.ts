import {
  ApplicationCommandData,
  CommandInteraction,
  Interaction,
} from "discord.js";

import { ServerService } from "./server-service";

const START_WORLD_OPT = "world";

interface Command {
  data(service: ServerService): Promise<Omit<ApplicationCommandData, "name">>;
  handler(
    service: ServerService,
    interaction: CommandInteraction
  ): Promise<unknown>;
}

const commands: { [name: string]: Command } = {
  start: {
    data: async (service) => ({
      description: "Starts the Minecraft server",
      options: [
        {
          name: START_WORLD_OPT,
          type: "STRING",
          description: "The world to start",
          required: true,
          choices: (await service.getWorlds()).map((world) => ({
            name: world,
            value: world,
          })),
        },
      ],
    }),
    handler: async (service, interaction) => {
      const world = interaction.options.get(START_WORLD_OPT)!.value as string;
      await interaction.reply(`Starting \`${world}\``);
      await service.start(world);
      await interaction.reply(
        `Started! Connect to ${process.env.URL} to play.`
      );
    },
  },
  stop: {
    data: async () => ({ description: "Stops the Minecraft server" }),
    handler: async (service, interaction) => {
      await interaction.reply("Stopping...");
      await service.stop();
      await interaction.reply("Stopped");
    },
  },
  status: {
    data: async () => ({ description: "Gets the Minecraft server status" }),
    handler: async (service, interaction) => {
      const runningWorlds = await service.getRunningWorlds();
      if (runningWorlds.length === 0) {
        await interaction.reply("Minecraft is offline");
      } else {
        const [world] = runningWorlds;
        await interaction.reply(`\`${world}\` is online`);
      }
    },
  },
};

export async function makeCommands(
  service: ServerService
): Promise<ApplicationCommandData[]> {
  return Promise.all(
    Object.entries(commands).map(([name, command]) =>
      command.data(service).then((s) => ({ ...s, name }))
    )
  );
}

export function makeCommandHandler(
  service: ServerService
): (interaction: Interaction) => Promise<void> {
  return async (interaction) => {
    if (!interaction.isCommand()) {
      return;
    }

    if (service.locked) {
      await interaction.reply("I'm busy right now, try again in 30 seconds.");
    } else {
      await commands[interaction.commandName]?.handler(service, interaction);
    }
  };
}

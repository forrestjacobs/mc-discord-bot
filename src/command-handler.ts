import {
  ApplicationCommandData,
  ApplicationCommandOptionData,
  CommandInteraction,
  Interaction,
} from "discord.js";

import { ServerService } from "./server-service";

const START_WORLD_OPT = "world";

interface SubCommand {
  data(
    service: ServerService
  ): Promise<Omit<ApplicationCommandOptionData, "name" | "type">>;
  handler(
    service: ServerService,
    interaction: CommandInteraction
  ): Promise<unknown>;
}

function getPlayerClause({
  players,
  maxPlayers,
}: {
  players: Array<string | undefined>;
  maxPlayers: number;
}): string {
  if (players.length === 0) {
    return "but no one is logged in";
  }

  const playerList = players
    .map((player) => `- ${player ?? "Unknown"}`)
    .join("\n");
  return `with ${players.length}/${maxPlayers} online:\n${playerList}`;
}

const subCommands: { [name: string]: SubCommand } = {
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
      // Since "world" is required, we know it's not null
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const world = interaction.options.getString(START_WORLD_OPT)!;

      await interaction.deferReply();
      await service.start(world);
      await interaction.followUp(
        `Started \`${world}\`! Connect to ${process.env.URL} to play.`
      );
    },
  },
  stop: {
    data: async () => ({ description: "Stops the Minecraft server" }),
    handler: async (service, interaction) => {
      await interaction.deferReply();
      await service.stop();
      await interaction.followUp("Stopped");
    },
  },
  status: {
    data: async () => ({
      description: "Gets the status of the Minecraft server",
    }),
    handler: async (service, interaction) => {
      await interaction.deferReply();
      const status = await service.getStatus();
      await interaction.followUp(
        status === undefined
          ? "Minecraft is offline"
          : `\`${status.world}\` is online, ${getPlayerClause(status)}`
      );
    },
  },
};

export async function makeCommands(
  service: ServerService
): Promise<ApplicationCommandData[]> {
  return [
    {
      name: "mc",
      description: "Controls the Minecraft server",
      options: await Promise.all(
        Object.entries(subCommands).map(async ([name, subCommand]) => {
          const data = await subCommand.data(service);
          return {
            ...data,
            name,
            type: "SUB_COMMAND",
          } as ApplicationCommandOptionData;
        })
      ),
    },
  ];
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
      return;
    }

    const subCommandName = interaction.options.getSubcommand();
    try {
      await subCommands[subCommandName]?.handler(service, interaction);
    } catch (e) {
      interaction.followUp(`${e}`);
    }
  };
}

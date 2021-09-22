import {
  Command,
  CommandInteraction,
  followUp,
  Interaction,
  InteractionResponse,
  SubCommand,
} from "./discord";
import { ServerService } from "./server-service";

const START_WORLD_OPT = "world";

interface SubCommandBuilder {
  data(service: ServerService): Omit<SubCommand, "name" | "type">;
  handler(
    service: ServerService,
    interaction: CommandInteraction
  ): Promise<string>;
}

type SubCommandName = "start" | "stop" | "status";

const subCommands: { [name in SubCommandName]: SubCommandBuilder } = {
  start: {
    data: (service) => ({
      description: "Starts the Minecraft server",
      options: [
        {
          name: START_WORLD_OPT,
          type: 3, // string
          description: "The world to start",
          required: true,
          choices: service.worlds.map((world) => ({
            name: world,
            value: world,
          })),
        },
      ],
    }),
    handler: async (service, interaction) => {
      const world = interaction.data.options[0].options?.find(
        (o) => o.name === START_WORLD_OPT
      )?.value;
      if (world === undefined) {
        throw new Error("expected world");
      }
      await service.start(world);
      return `Started \`${world}\`! Connect to ${process.env.URL} to play.`;
    },
  },
  stop: {
    data: () => ({ description: "Stops the Minecraft server" }),
    handler: async (service) => {
      await service.stop();
      return "Stopped";
    },
  },
  status: {
    data: () => ({
      description: "Gets the status of the Minecraft server",
    }),
    handler: async (service) => {
      const status = await service.getStatus();
      if (status === undefined) {
        return "Minecraft is offline";
      }
      const numPlayers = status.numPlayers;
      const players = numPlayers === 1 ? "player" : "players";
      return `\`${status.world}\` is up, with ${numPlayers} ${players} online`;
    },
  },
};

export function makeCommands(service: ServerService): Command[] {
  return [
    {
      name: "mc",
      type: 1, // Slash command
      description: "Controls the Minecraft server",
      options: Object.entries(subCommands).map(([name, subCommand]) => ({
        ...subCommand.data(service),
        name,
        type: 1, // Sub command
      })),
    },
  ];
}

export function makeCommandHandler(service: ServerService): (
  interaction: Interaction
) => {
  promise: Promise<void>;
  response: InteractionResponse;
} {
  return (interaction) => {
    if (interaction.type === 1) {
      return {
        promise: Promise.resolve(),
        response: { type: 1 },
      }; // ack
    }
    if (interaction.type === 2) {
      if (service.locked) {
        return {
          promise: Promise.resolve(),
          response: {
            type: 4, // message
            data: {
              content: "I'm busy right now, try again in 30 seconds.",
            },
          },
        };
      }

      const subCommandName = interaction.data.options[0].name as SubCommandName;
      const promise = subCommands[subCommandName]
        .handler(service, interaction)
        .catch((reason) => `${reason}`)
        .then((content) => followUp(interaction, content));

      return {
        promise,
        response: { type: 5 },
      }; // defer
    }
    throw new Error("Expected interaction type");
  };
}

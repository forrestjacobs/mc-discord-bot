import { followUp } from "./discord";
import { ServerService } from "./mc-server-service";
import { CommandInteraction, Interaction, InteractionResponse } from "./types";

async function handleCommand(
  service: ServerService,
  interaction: CommandInteraction
): Promise<string> {
  const subCmdData = interaction.data.options[0];
  if (subCmdData.name === "start") {
    const world = subCmdData.options[0].value;
    await service.start(world);
    return `Started \`${world}\`! Connect to ${process.env.URL} to play.`;
  } else if (subCmdData.name === "stop") {
    await service.stop();
    return "Stopped";
  }

  const status = await service.getStatus();
  if (status === undefined) {
    return "Minecraft is offline";
  }
  const numPlayers = status.numPlayers;
  const players = numPlayers === 1 ? "player" : "players";
  return `\`${status.world}\` is up, with ${numPlayers} ${players} online`;
}

export function makeInteractionHandler(service: ServerService): (
  interaction: Interaction
) => {
  promise: Promise<unknown>;
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

      return {
        promise: handleCommand(service, interaction)
          .catch((reason) => `${reason}`)
          .then((content) => followUp(interaction, content)),
        response: { type: 5 }, // defer
      };
    }
    throw new Error("Expected interaction type");
  };
}

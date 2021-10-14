import { setTimeout } from "timers/promises";

import { followUp } from "./discord";
import { ServerService } from "./mc-server-service";
import { CommandInteraction, Interaction, InteractionResponse } from "./types";

const DEFER_TIMEOUT = 1500;

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
  if (status === null) {
    return "Minecraft is offline";
  }
  const numPlayers = status.numPlayers;
  const players = numPlayers === 1 ? "player" : "players";
  return `\`${status.world}\` is up, with ${numPlayers} ${players} online`;
}

function makeMessageResponse(content: string): InteractionResponse {
  return {
    type: 4, // message
    data: { content },
  };
}

export type InteractionHandlerResponse = {
  response: InteractionResponse;
  completion: Promise<unknown>;
};

function makeCompletedHandlerResponse(
  response: InteractionResponse
): InteractionHandlerResponse {
  return {
    response,
    completion: Promise.resolve(),
  };
}

export function makeInteractionHandler(
  service: ServerService
): (interaction: Interaction) => Promise<InteractionHandlerResponse> {
  return async (interaction) => {
    if (interaction.type === 1) {
      return makeCompletedHandlerResponse({ type: 1 }); // ack
    }
    if (interaction.type === 2) {
      if (service.locked) {
        return makeCompletedHandlerResponse(
          makeMessageResponse("I'm busy right now, try again in 30 seconds.")
        );
      }

      const pendingResponse = handleCommand(service, interaction);

      const timeoutAborter = new AbortController();
      const timeout = setTimeout<false>(DEFER_TIMEOUT, false, {
        signal: timeoutAborter.signal,
      });

      const fastResponse = await Promise.race([pendingResponse, timeout]);
      if (fastResponse === false) {
        return {
          response: { type: 5 }, // defer
          completion: pendingResponse
            .catch((reason) => `${reason}`)
            .then((content) => followUp(interaction, content)),
        };
      } else {
        timeoutAborter.abort();
        return makeCompletedHandlerResponse(makeMessageResponse(fastResponse));
      }
    }
    throw new Error("Expected interaction type");
  };
}

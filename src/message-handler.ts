import { Message } from "discord.js";

import { ServerService } from "./server-service";

export interface MessageHandlerConfig {
  botUserId: string;
  serverService: ServerService;
}

function shouldHandle(message: Message, botUserId: string): boolean {
  return (
    !message.author.bot &&
    !message.mentions.everyone &&
    message.mentions.has(botUserId)
  );
}

const START = /\bstart ([\w\-.:\\]*)\b/i;
const STOP = /\bstop\b/i;

function formatCommandsForHelp(commands: string[]): string {
  return `You can tell me:${commands.map((c) => `\n- \`${c}\``).join()}`;
}

export function makeMessageHandler(
  config: MessageHandlerConfig
): (message: Message) => void {
  return async (message) => {
    if (!shouldHandle(message, config.botUserId)) {
      return;
    }

    const channel = message.channel;
    try {
      const world = START.exec(message.content)?.[1];

      if (config.serverService.locked) {
        channel.send("I'm busy right now, try again in 30 seconds.");
      } else if (world !== undefined) {
        channel.send(`Starting \`${world}\``);
        await config.serverService.start(world);
        channel.send(`Started! Connect to ${process.env.URL} to play.`);
      } else if (STOP.test(message.content)) {
        channel.send("Stopping...");
        await config.serverService.stop();
        channel.send("Stopped");
      } else {
        const runningWorlds = await config.serverService.getRunningWorlds();
        if (runningWorlds.length === 0) {
          const worlds = await config.serverService.getWorlds();
          const commands = worlds.map((w) => `start ${w}`);
          message.reply(
            `Minecraft is offline. ${formatCommandsForHelp(commands)}`
          );
        } else {
          const [world] = runningWorlds;
          message.reply(
            `\`${world}\` is online. ${formatCommandsForHelp(["stop"])}`
          );
        }
      }
    } catch (e) {
      channel.send(`Something went wrong:\n>>> ${e}`);
    }
  };
}

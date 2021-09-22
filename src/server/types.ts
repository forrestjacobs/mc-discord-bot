import { CommandInteractionOption } from "../common/types";

export type PingInteraction = {
  type: 1;
};

export type CommandInteraction = {
  type: 2;
  data: {
    options: [CommandInteractionOption];
  };
  token: string;
};

export type Interaction = PingInteraction | CommandInteraction;

export type InteractionResponse = {
  type: number;
  data?: {
    content: string;
  };
};

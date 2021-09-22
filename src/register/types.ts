import { SubCommand } from "../common/types";

export type Command = {
  name: "mc";
  type: 1;
  options: SubCommand[];
};

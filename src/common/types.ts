type BasicSubCommands = { name: "stop" | "status" };
type StartSubCommandConfig = {
  name: "start";
  option: "world";
};

export type SubCommand = { type: 1 } & (
  | BasicSubCommands
  | {
      name: StartSubCommandConfig["name"];
      options: [
        {
          name: StartSubCommandConfig["option"];
          type: 3;
          required: true;
          choices: Array<{ name: string; value: string }>;
        }
      ];
    }
);

export type CommandInteractionOption =
  | BasicSubCommands
  | {
      name: StartSubCommandConfig["name"];
      options: [{ name: StartSubCommandConfig["option"]; value: string }];
    };

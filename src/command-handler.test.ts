import { CommandInteraction } from "discord.js";

import { makeCommandHandler, makeCommands } from "./command-handler";
import { ServerService } from "./server-service";

it("can generate commands", async () => {
  const service = {
    getWorlds: () => Promise.resolve(["one", "two"]),
  } as Partial<ServerService> as ServerService;

  const commands = await makeCommands(service);
  expect(commands).toMatchObject([
    {
      name: "mc",
      options: [
        {
          name: "start",
          type: "SUB_COMMAND",
          options: [
            {
              name: "world",
              type: "STRING",
              required: true,
              choices: [
                {
                  name: "one",
                  value: "one",
                },
                {
                  name: "two",
                  value: "two",
                },
              ],
            },
          ],
        },
        {
          name: "stop",
        },
        {
          name: "status",
        },
      ],
    },
  ]);
});

it("does not handle any command if locked", async () => {
  const service = {
    locked: true,
  } as Partial<ServerService> as ServerService;
  const interaction = {
    isCommand: () => true,
    reply: jest.fn(() => Promise.resolve()),
  } as unknown as CommandInteraction;
  await makeCommandHandler(service)(interaction);
  expect(interaction.reply).toHaveBeenCalledWith(
    "I'm busy right now, try again in 30 seconds."
  );
});

it("can start the server", async () => {
  process.env.URL = "example.com";
  const service = {
    start: jest.fn(() => Promise.resolve()),
  } as Partial<ServerService> as ServerService;
  const interaction = {
    isCommand: () => true,
    options: {
      getSubcommand: () => "start",
      getString: jest.fn(() => "one"),
    },
    deferReply: jest.fn(() => Promise.resolve()),
    followUp: jest.fn(() => Promise.resolve()),
  } as unknown as CommandInteraction;
  await makeCommandHandler(service)(interaction);
  expect(interaction.deferReply).toHaveBeenCalled();
  expect(service.start).toHaveBeenCalledWith("one");
  expect(interaction.followUp).toHaveBeenCalledWith(
    "Started `one`! Connect to example.com to play."
  );
});

it("can stop the server", async () => {
  const service = {
    stop: jest.fn(() => Promise.resolve()),
  } as Partial<ServerService> as ServerService;
  const interaction = {
    isCommand: () => true,
    options: {
      getSubcommand: () => "stop",
    },
    deferReply: jest.fn(() => Promise.resolve()),
    followUp: jest.fn(() => Promise.resolve()),
  } as unknown as CommandInteraction;
  await makeCommandHandler(service)(interaction);
  expect(interaction.deferReply).toHaveBeenCalled();
  expect(service.stop).toHaveBeenCalled();
  expect(interaction.followUp).toHaveBeenCalledWith("Stopped");
});

it("reports when Minecraft is offline", async () => {
  const service = {
    getStatus: jest.fn(() => Promise.resolve(undefined)),
  } as Partial<ServerService> as ServerService;
  const interaction = {
    isCommand: () => true,
    options: {
      getSubcommand: () => "status",
    },
    deferReply: jest.fn(() => Promise.resolve()),
    followUp: jest.fn(() => Promise.resolve()),
  } as unknown as CommandInteraction;
  await makeCommandHandler(service)(interaction);
  expect(interaction.deferReply).toHaveBeenCalled();
  expect(service.getStatus).toHaveBeenCalled();
  expect(interaction.followUp).toHaveBeenCalledWith("Minecraft is offline");
});

it("reports when no one is logged in", async () => {
  const service = {
    getStatus: jest.fn(() =>
      Promise.resolve({
        world: "one",
        numPlayers: 0,
      })
    ),
  } as Partial<ServerService> as ServerService;
  const interaction = {
    isCommand: () => true,
    options: {
      getSubcommand: () => "status",
    },
    deferReply: jest.fn(() => Promise.resolve()),
    followUp: jest.fn(() => Promise.resolve()),
  } as unknown as CommandInteraction;
  await makeCommandHandler(service)(interaction);
  expect(interaction.deferReply).toHaveBeenCalled();
  expect(service.getStatus).toHaveBeenCalled();
  expect(interaction.followUp).toHaveBeenCalledWith(
    "`one` is up, with 0 players online"
  );
});

it("counts logged in users", async () => {
  const service = {
    getStatus: jest.fn(() =>
      Promise.resolve({
        world: "one",
        numPlayers: 2,
      })
    ),
  } as Partial<ServerService> as ServerService;
  const interaction = {
    isCommand: () => true,
    options: {
      getSubcommand: () => "status",
    },
    deferReply: jest.fn(() => Promise.resolve()),
    followUp: jest.fn(() => Promise.resolve()),
  } as unknown as CommandInteraction;
  await makeCommandHandler(service)(interaction);
  expect(interaction.deferReply).toHaveBeenCalled();
  expect(service.getStatus).toHaveBeenCalled();
  expect(interaction.followUp).toHaveBeenCalledWith(
    "`one` is up, with 2 players online"
  );
});

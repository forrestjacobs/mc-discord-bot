import { followUp } from "./discord";
import { makeInteractionHandler } from "./interaction-handler";
import { ServerService } from "./mc-server-service";
import { Interaction } from "./types";

jest.mock("./discord");

it("does not handle any command if locked", () => {
  const service = {
    locked: true,
  } as Partial<ServerService> as ServerService;
  const interaction = {
    type: 2,
  } as Partial<Interaction> as Interaction;
  const { response } = makeInteractionHandler(service)(interaction);
  expect(response).toStrictEqual({
    type: 4,
    data: {
      content: "I'm busy right now, try again in 30 seconds.",
    },
  });
});

it("can start the server", async () => {
  process.env.URL = "example.com";
  const service = {
    start: jest.fn(() => Promise.resolve()),
  } as Partial<ServerService> as ServerService;
  const interaction = {
    type: 2,
    data: {
      options: [
        {
          name: "start",
          options: [
            {
              name: "world",
              value: "one",
            },
          ],
        },
      ],
    },
  } as Partial<Interaction> as Interaction;

  const { promise, response } = makeInteractionHandler(service)(interaction);
  expect(response).toStrictEqual({ type: 5 });
  await promise;

  expect(service.start).toHaveBeenCalledWith("one");
  expect(followUp).toHaveBeenCalledWith(
    interaction,
    "Started `one`! Connect to example.com to play."
  );
});

it("can stop the server", async () => {
  const service = {
    stop: jest.fn(() => Promise.resolve()),
  } as Partial<ServerService> as ServerService;
  const interaction = {
    type: 2,
    data: {
      options: [
        {
          name: "stop",
        },
      ],
    },
  } as Partial<Interaction> as Interaction;

  const { promise, response } = makeInteractionHandler(service)(interaction);
  expect(response).toStrictEqual({ type: 5 });
  await promise;

  expect(service.stop).toHaveBeenCalled();
  expect(followUp).toHaveBeenCalledWith(interaction, "Stopped");
});

it("reports when Minecraft is offline", async () => {
  const service = {
    getStatus: jest.fn(() => Promise.resolve(undefined)),
  } as Partial<ServerService> as ServerService;
  const interaction = {
    type: 2,
    data: {
      options: [
        {
          name: "status",
        },
      ],
    },
  } as Partial<Interaction> as Interaction;

  const { promise, response } = makeInteractionHandler(service)(interaction);
  expect(response).toStrictEqual({ type: 5 });
  await promise;

  expect(service.getStatus).toHaveBeenCalled();
  expect(followUp).toHaveBeenCalledWith(interaction, "Minecraft is offline");
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
    type: 2,
    data: {
      options: [
        {
          name: "status",
        },
      ],
    },
  } as Partial<Interaction> as Interaction;

  const { promise, response } = makeInteractionHandler(service)(interaction);
  expect(response).toStrictEqual({ type: 5 });
  await promise;

  expect(service.getStatus).toHaveBeenCalled();
  expect(followUp).toHaveBeenCalledWith(
    interaction,
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
    type: 2,
    data: {
      options: [
        {
          name: "status",
        },
      ],
    },
  } as Partial<Interaction> as Interaction;

  const { promise, response } = makeInteractionHandler(service)(interaction);
  expect(response).toStrictEqual({ type: 5 });
  await promise;

  expect(service.getStatus).toHaveBeenCalled();
  expect(followUp).toHaveBeenCalledWith(
    interaction,
    "`one` is up, with 2 players online"
  );
});
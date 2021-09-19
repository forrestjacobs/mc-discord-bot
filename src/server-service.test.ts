import { stat } from "fs/promises";
import { query } from "gamedig";

import { ServerService } from "./server-service";
import { isActive, listServiceUnitFiles } from "./systemd";

jest.mock("fs/promises");
jest.mock("gamedig");
jest.mock("./systemd");

it("fetches worlds ordered by last launch date", async () => {
  (listServiceUnitFiles as jest.Mock).mockReturnValueOnce(
    Promise.resolve(["mc-world-one", "mc-world-two", "mc-world-three"])
  );

  const mtimes: { [path: string]: number } = {
    "/var/lib/mc-discord-bot/world-order/one": 0,
    "/var/lib/mc-discord-bot/world-order/two": 30,
    "/var/lib/mc-discord-bot/world-order/three": 10,
  };
  (stat as jest.Mock).mockImplementation((world) =>
    Promise.resolve({ mtimeMs: mtimes[world] })
  );

  const worlds = await new ServerService().getWorlds();
  expect(listServiceUnitFiles).toHaveBeenCalledWith("mc-world-*");
  expect(worlds).toEqual(["two", "three", "one"]);
});

it("can get the status when no world is online", async () => {
  (listServiceUnitFiles as jest.Mock).mockReturnValueOnce(
    Promise.resolve(["mc-world-a", "mc-world-b"])
  );
  (isActive as jest.Mock).mockReturnValueOnce(Promise.resolve(false));
  (isActive as jest.Mock).mockReturnValueOnce(Promise.resolve(false));

  const status = await new ServerService().getStatus();
  expect(listServiceUnitFiles).toHaveBeenCalledWith("mc-world-*");
  expect(isActive).toHaveBeenCalledWith("mc-world-a");
  expect(isActive).toHaveBeenCalledWith("mc-world-b");
  expect(status).toBeUndefined();
});

it("can get the status when a world is online", async () => {
  (listServiceUnitFiles as jest.Mock).mockReturnValueOnce(
    Promise.resolve(["mc-world-a", "mc-world-b"])
  );
  (isActive as jest.Mock).mockImplementation((world) => world === "mc-world-b");
  (query as jest.Mock).mockReturnValueOnce(
    Promise.resolve({
      players: [{ name: "bob" }, {}, { name: "alice" }],
    })
  );

  const status = await new ServerService().getStatus();
  expect(listServiceUnitFiles).toHaveBeenCalledWith("mc-world-*");
  expect(isActive).toHaveBeenCalledWith("mc-world-a");
  expect(isActive).toHaveBeenCalledWith("mc-world-b");
  expect(query).toHaveBeenCalled();
  expect(status).toStrictEqual({
    world: "b",
    numPlayers: 3,
  });
});

it("checks that a world exists before starting it", async () => {
  (listServiceUnitFiles as jest.Mock).mockReturnValueOnce(
    Promise.resolve(["mc-world-a", "mc-world-b"])
  );

  await expect(new ServerService().start("c")).rejects.toEqual(
    new Error('"c" is not a Minecraft world')
  );
});

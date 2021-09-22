import { query } from "gamedig";

import { ServerService } from "./mc-server-service";
import { isActive } from "./systemd";

jest.mock("fs/promises");
jest.mock("gamedig");
jest.mock("./systemd");

it("can get the status when no world is online", async () => {
  (isActive as jest.Mock).mockReturnValueOnce(Promise.resolve(false));
  (isActive as jest.Mock).mockReturnValueOnce(Promise.resolve(false));

  const status = await new ServerService(["a", "b"]).getStatus();
  expect(isActive).toHaveBeenCalledWith("mc-world-a");
  expect(isActive).toHaveBeenCalledWith("mc-world-b");
  expect(status).toBeUndefined();
});

it("can get the status when a world is online", async () => {
  (isActive as jest.Mock).mockImplementation((world) => world === "mc-world-b");
  (query as jest.Mock).mockReturnValueOnce(
    Promise.resolve({
      players: [{ name: "bob" }, {}, { name: "alice" }],
    })
  );

  const status = await new ServerService(["a", "b"]).getStatus();
  expect(isActive).toHaveBeenCalledWith("mc-world-a");
  expect(isActive).toHaveBeenCalledWith("mc-world-b");
  expect(query).toHaveBeenCalled();
  expect(status).toStrictEqual({
    world: "b",
    numPlayers: 3,
  });
});

it("checks that a world exists before starting it", async () => {
  await expect(new ServerService(["a", "b"]).start("c")).rejects.toEqual(
    new Error('"c" is not a Minecraft world')
  );
});

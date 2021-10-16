import { execFile } from "./child-process";
import { isActive, start, stop } from "../common/systemd";

jest.mock("./child-process");

it("can start a service", async () => {
  (execFile as jest.Mock).mockReturnValueOnce(Promise.resolve());
  await start("mc-world");
  expect(execFile).toHaveBeenCalledWith("systemctl", ["start", "mc-world"]);
});

it("can stop a service", async () => {
  (execFile as jest.Mock).mockReturnValueOnce(Promise.resolve());
  await stop("mc-world");
  expect(execFile).toHaveBeenCalledWith("systemctl", ["stop", "mc-world"]);
});

it("can report that a service is active", async () => {
  (execFile as jest.Mock).mockReturnValueOnce(Promise.resolve());
  const active = await isActive("mc-world");
  expect(execFile).toHaveBeenCalledWith("systemctl", ["is-active", "mc-world"]);
  expect(active).toBe(true);
});

it("can report that a service is inactive", async () => {
  (execFile as jest.Mock).mockReturnValueOnce(Promise.reject());
  const active = await isActive("mc-world");
  expect(execFile).toHaveBeenCalledWith("systemctl", ["is-active", "mc-world"]);
  expect(active).toBe(false);
});

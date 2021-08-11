import { execFile } from "./child-process";
import { isActive, listServiceUnitFiles, start, stop } from "./systemd";

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

it("lists service unit files", async () => {
  (execFile as jest.Mock).mockReturnValueOnce(
    Promise.resolve({
      stdout:
        "UNIT FILE              STATE  VENDOR PRESET\n\
mc-world-one.service   linked enabled\n\
mc-world-two.service   linked enabled\n\
mc-world-three.service linked enabled\n\
\n\
3 unit files listed\n",
    })
  );
  const services = await listServiceUnitFiles("mc-world-*");
  expect(execFile).toHaveBeenCalledWith("systemctl", [
    "list-unit-files",
    "--type=service",
    "mc-world-*",
  ]);
  expect(services).toStrictEqual([
    "mc-world-one",
    "mc-world-two",
    "mc-world-three",
  ]);
});

it("lists empty service unit file result", async () => {
  (execFile as jest.Mock).mockReturnValueOnce(
    Promise.resolve({
      stdout: "UNIT FILE STATE VENDOR PRESET\n\
\n\
0 unit files listed\n",
    })
  );
  const services = await listServiceUnitFiles("test-*");
  expect(execFile).toHaveBeenCalledWith("systemctl", [
    "list-unit-files",
    "--type=service",
    "test-*",
  ]);
  expect(services).toStrictEqual([]);
});

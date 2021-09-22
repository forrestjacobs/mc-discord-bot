import { makeCommand } from "./command";

it("can generate commands", () => {
  const command = makeCommand(["one", "two"]);
  expect(command).toMatchObject({
    name: "mc",
    options: [
      {
        name: "start",
        type: 1,
        options: [
          {
            name: "world",
            type: 3,
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
  });
});

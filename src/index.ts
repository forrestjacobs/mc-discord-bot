import express from "express";

import { makeCommandHandler, makeCommands } from "./command-handler";
import { Interaction, overwriteCommands, verifyRequest } from "./discord";
import { ServerService } from "./server-service";

const service = new ServerService();
const handle = makeCommandHandler(service);

async function registerCommands(): Promise<void> {
  await overwriteCommands(await makeCommands(service));
  console.log("Commands set");
}

const app = express();
app.use(
  express.text({
    type: "application/json",
  })
);

app.post("/", async (req, res) => {
  if (verifyRequest(req)) {
    res.json(handle(JSON.parse(req.body) as Interaction));
  } else {
    res.status(401).send("401 Unauthorized");
  }
});

app.listen(3000, async () => {
  await registerCommands();
  service.addStartCallback(() => {
    registerCommands();
  });
});

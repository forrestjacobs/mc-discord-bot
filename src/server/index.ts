import express from "express";

import { getWorlds } from "../common/env";
import { verifyRequest } from "./discord";
import { makeInteractionHandler } from "./interaction-handler";
import { ServerService } from "./mc-server-service";
import { Interaction } from "./types";

const service = new ServerService(getWorlds());
const handle = makeInteractionHandler(service);

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

app.listen(3000);

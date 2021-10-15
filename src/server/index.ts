import { createServer, IncomingMessage } from "http";

import { getEnv, getWorlds } from "../common/env";
import { verifyRequest } from "./discord";
import { makeInteractionHandler } from "./interaction-handler";
import { ServerService } from "./mc-server-service";
import { getFileDescriptor } from "./systemd";
import { Interaction } from "./types";

const service = new ServerService(getWorlds());
const handle = makeInteractionHandler(service);

function getBody(req: IncomingMessage): Promise<string> {
  return new Promise<string>((resolve) => {
    let content = "";
    req.on("data", (chunk: string) => {
      content += chunk;
    });
    req.on("close", () => {
      resolve(content);
    });
  });
}

const server = createServer(async (req, res) => {
  try {
    const body = await getBody(req);
    if (verifyRequest(body, req)) {
      const interaction = JSON.parse(body) as Interaction;
      const { response } = await handle(interaction);
      res
        .writeHead(200, { "Content-Type": "application/json" })
        .end(JSON.stringify(response));
    } else {
      res.writeHead(401).end("Unauthorized");
    }
  } catch (e) {
    console.error(e);
    res.writeHead(500).end("Internal Server Error");
  }
});
server.listen(getFileDescriptor() ?? { port: parseInt(getEnv("PORT"), 10) });

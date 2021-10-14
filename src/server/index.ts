import { createServer, IncomingMessage } from "http";

import { getEnv, getWorlds } from "../common/env";
import { verifyRequest } from "./discord";
import { makeInteractionHandler } from "./interaction-handler";
import { ServerService } from "./mc-server-service";
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
      res
        .writeHead(200, { "Content-Type": "application/json" })
        .end(await handle(JSON.parse(body) as Interaction));
    } else {
      res.writeHead(401).end("Unauthorized");
    }
  } catch (e) {
    console.error(e);
    res.writeHead(500).end("Internal Server Error");
  }
});
server.listen({ port: parseInt(getEnv("PORT"), 10) });

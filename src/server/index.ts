import { createServer, IncomingMessage } from "http";
import { SocketConstructorOpts } from "net";

import { getEnv } from "../common/env";
import { getWorlds } from "../common/worlds";
import { verifyRequest } from "./discord";
import { makeInteractionHandler } from "./interaction-handler";
import { ServerService } from "./mc-server-service";
import { Interaction } from "./types";

const service = new ServerService(getWorlds());
const handle = makeInteractionHandler(service);

function getFileDescriptor(): SocketConstructorOpts | null {
  const fds = process.env.LISTEN_FDS;
  return fds !== undefined && parseInt(fds, 10) > 0 ? { fd: 3 } : null;
}

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

const fd = getFileDescriptor();

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
  if (fd !== null) {
    server.unref();
  }
});

server.listen(fd ?? { port: parseInt(getEnv("PORT"), 10) });

import { promisify } from "util";

export const wait = promisify(setTimeout);

export function keepTrying(
  pause: number,
  timeout: number,
  cb: () => Promise<unknown>
): Promise<unknown> {
  return Promise.race([
    wait(timeout).then(() => {
      throw new Error("Took too long");
    }),
    new Promise<void>(async (r) => {
      while (true) {
        try {
          const [, results] = await Promise.all([wait(pause), cb()]);
          console.log(results);
          break;
        } catch (e) {
          console.error(e);
        }
      }
      r();
    }),
  ]);
}

import { setTimeout } from "timers/promises";

export function keepTrying(
  pause: number,
  timeout: number,
  cb: () => Promise<unknown>
): Promise<unknown> {
  return Promise.race([
    setTimeout(timeout).then(() => {
      throw new Error("Took too long");
    }),
    new Promise<void>(async (r) => {
      while (true) {
        try {
          const [, results] = await Promise.all([setTimeout(pause), cb()]);
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

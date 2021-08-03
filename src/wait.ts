export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

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

export function getEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Expected environment variable ${name} to be set`);
  }
  return value;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals = 2): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

export function pick<T>(items: readonly T[]): T {
  const item = items[randomInt(0, items.length - 1)];
  if (item === undefined) {
    throw new Error("pick() chamado com array vazio");
  }
  return item;
}

export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += chars[randomInt(0, chars.length - 1)];
  }
  return result;
}

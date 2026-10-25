function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function demoTx(kind: string, id: string): string {
  const seed = `${kind}:${id}`;
  let hex = "";
  for (let index = 0; index < 4; index += 1) {
    hex += hashString(`${seed}:${index}`).toString(16).padStart(8, "0");
  }
  return `0x${hex.padEnd(64, "0").slice(0, 64)}`;
}

export function demoCreditTokenId(id: string): number {
  return 900000 + (hashString(`credit:${id}`) % 99999);
}

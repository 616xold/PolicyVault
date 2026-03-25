export function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

export function kv(label: string, value: string | number | bigint): void {
  console.log(`${label}: ${value}`);
}

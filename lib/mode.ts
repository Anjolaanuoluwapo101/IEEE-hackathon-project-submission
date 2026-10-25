export function isDemoMode(): boolean {
  const flag = (process.env.DEMO_MODE ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(flag)) return true;
  if (["0", "false", "no", "off"].includes(flag)) return false;
  return (
    !process.env.NEXT_PUBLIC_BATCH_NFT_ADDRESS || !process.env.PRIVATE_KEY
  );
}

export function getShowFinalBalance(
  currentBalance: string,
  change: string,
): string | null {
  if (!/^-?\d+$/.test(currentBalance) || !/^-?\d+$/.test(change)) {
    return null;
  }

  const current = BigInt(currentBalance);
  const difference = BigInt(change);

  const minimum = BigInt("-9223372036854775808");
  const maximum = BigInt("9223372036854775807");

  if (difference < minimum || difference > maximum) {
    return null;
  }

  const finalBalance = current + difference;

  if (finalBalance < BigInt(0) || finalBalance > maximum) {
    return null;
  }

  return finalBalance.toString();
}

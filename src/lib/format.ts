const persian = "۰۱۲۳۴۵۶۷۸۹";

export function faDigits(value: string) {
  return value.replace(/\d/g, (digit) => persian[Number(digit)] ?? digit);
}

export function faNum(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "٬")
    .replace(/\d/g, (digit) => persian[Number(digit)] ?? digit);
}

export function toman(value: number) {
  return `${faNum(value)} تومان`;
}

export function estimate(
  job: { seconds: number; rate: number },
  hoursPerDay: number,
  days: number,
) {
  const hours = Math.min(8, Math.max(1, Math.round(hoursPerDay)));
  const safeDays = Math.min(6, Math.max(1, Math.round(days)));
  const perDay = Math.floor((hours * 3600) / job.seconds);
  const pieces = perDay * safeDays;
  return {
    hours,
    days: safeDays,
    perDay,
    pieces,
    amount: pieces * job.rate,
  };
}

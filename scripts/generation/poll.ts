export const nextBackoffMs = (attempt: number): number => {
  const raw = Math.round(2000 * Math.pow(1.5, attempt));
  return Math.min(15000, raw);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

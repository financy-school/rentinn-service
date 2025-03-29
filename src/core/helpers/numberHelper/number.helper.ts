export const isFloat = (count: number) => {
  return Number(count) === count && count % 1 !== 0;
};

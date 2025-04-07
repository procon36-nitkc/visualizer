// ~/utils/rotation.ts
export const applyRotation = (
  f: number[][],
  x: number,
  y: number,
  n: number,
  clockwise = true
): number[][] => {
  const newField: number[][] = f.map((row) => [...row]);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (clockwise) {
        newField[y + j][x + n - 1 - i] = f[y + i][x + j];
      } else {
        newField[y + n - 1 - j][x + i] = f[y + i][x + j];
      }
    }
  }
  return newField;
};

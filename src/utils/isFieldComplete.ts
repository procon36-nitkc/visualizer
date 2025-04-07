export function isFieldComplete(field: number[][]): boolean {
  const height = field.length;
  const width = field[0]?.length ?? 0;
  const seen = new Set<string>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = field[y][x];
      const key = `${x},${y}`;

      if (seen.has(key)) continue;

      // 4近傍を探索
      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];

      let hasPair = false;

      for (const [nx, ny] of neighbors) {
        if (
          nx >= 0 &&
          ny >= 0 &&
          nx < width &&
          ny < height &&
          field[ny][nx] === value &&
          !seen.has(`${nx},${ny}`)
        ) {
          hasPair = true;
          seen.add(`${nx},${ny}`);
          break;
        }
      }

      if (!hasPair) {
        return false; // ペアが見つからないセルがあれば即NG
      }

      seen.add(key);
    }
  }

  return true;
}

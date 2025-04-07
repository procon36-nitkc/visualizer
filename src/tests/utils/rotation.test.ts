import { describe, it, expect } from "vitest";
import { applyRotation } from "@/utils/rotation";

describe("applyRotation", () => {
  const input2x2 = [
    [1, 2],
    [3, 4],
  ];

  it("rotates 2x2 square clockwise", () => {
    const result = applyRotation(input2x2, 0, 0, 2, true);
    expect(result).toEqual([
      [3, 1],
      [4, 2],
    ]);
  });

  it("rotates 2x2 square counterclockwise", () => {
    const result = applyRotation(input2x2, 0, 0, 2, false);
    expect(result).toEqual([
      [2, 4],
      [1, 3],
    ]);
  });

  it("rotates sub-square in larger 3x3 field (2x2 clockwise)", () => {
    const field = [
      [0, 0, 0],
      [0, 1, 2],
      [0, 3, 4],
    ];
    const result = applyRotation(field, 1, 1, 2, true);
    expect(result).toEqual([
      [0, 0, 0],
      [0, 3, 1],
      [0, 4, 2],
    ]);
  });

  it("rotates sub-square in larger 3x3 field (2x2 counterclockwise)", () => {
    const field = [
      [0, 0, 0],
      [0, 1, 2],
      [0, 3, 4],
    ];
    const result = applyRotation(field, 1, 1, 2, false);
    expect(result).toEqual([
      [0, 0, 0],
      [0, 2, 4],
      [0, 1, 3],
    ]);
  });

  it("rotates 3x3 square clockwise", () => {
    const input = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const result = applyRotation(input, 0, 0, 3, true);
    expect(result).toEqual([
      [7, 4, 1],
      [8, 5, 2],
      [9, 6, 3],
    ]);
  });

  it("rotates 3x3 square counterclockwise", () => {
    const input = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const result = applyRotation(input, 0, 0, 3, false);
    expect(result).toEqual([
      [3, 6, 9],
      [2, 5, 8],
      [1, 4, 7],
    ]);
  });

  it("does not mutate original input", () => {
    const original = [
      [1, 2],
      [3, 4],
    ];
    const copy = JSON.stringify(original);
    applyRotation(original, 0, 0, 2, true);
    expect(JSON.stringify(original)).toBe(copy);
  });
});

function generateSequentialField(size: number): number[][] {
  const field: number[][] = [];
  let counter = 1;
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      row.push(counter++);
    }
    field.push(row);
  }
  return field;
}

function deepEqual(a: number[][], b: number[][]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

describe("applyRotation random and large field tests", () => {
  it("applies random 100 rotations and undoes them all (size = 24)", () => {
    const size = 24;
    let field = generateSequentialField(size);
    const ops: { x: number; y: number; n: number }[] = [];

    for (let i = 0; i < 100; i++) {
      const maxN = Math.floor(Math.random() * (size / 2)) * 2 + 2; // 最小2、偶数サイズのみ
      const x = Math.floor(Math.random() * (size - maxN + 1));
      const y = Math.floor(Math.random() * (size - maxN + 1));
      ops.push({ x, y, n: maxN });
      field = applyRotation(field, x, y, maxN, true);
    }

    // Undo 全部
    for (let i = ops.length - 1; i >= 0; i--) {
      const { x, y, n } = ops[i];
      field = applyRotation(field, x, y, n, false);
    }

    const original = generateSequentialField(size);
    expect(deepEqual(field, original)).toBe(true);
  });
});
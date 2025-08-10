import type { OperationInput, Operation } from "~/types";

export function convertKyoproOpsToOps(kyoproOps: string): OperationInput {
  if (
    kyoproOps === null ||
    kyoproOps === undefined ||
    typeof kyoproOps !== "string"
  ) {
    throw new Error("Invalid operation input format");
  }

  const lines = kyoproOps
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    throw new Error("Invalid operation input format");
  }

  const count = parseInt(lines[0], 10);
  if (isNaN(count) || count < 0) {
    throw new Error("Invalid operation count format");
  }

  if (count === 0) {
    return { ops: [] };
  }

  if (lines.length !== count + 1) {
    throw new Error(
      `Expected ${count + 1} lines (1 header + ${count} operations), but got ${
        lines.length
      }`
    );
  }

  const operations: Operation[] = [];

  for (let i = 1; i <= count; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length !== 3) {
      throw new Error(
        "Invalid operation format: each line must have exactly 3 numbers (x, y, n)"
      );
    }

    const [x, y, n] = parts.map((part) => {
      const num = parseFloat(part);
      if (isNaN(num) || !Number.isInteger(num)) {
        throw new Error(`Invalid number: ${part}`);
      }

      if (num < 0) {
        throw new Error(`Negative number not allowed: ${part}`);
      }

      if (num.toString() != part) {
        throw new Error(`Invalid number: ${part}`);
      }
      return num;
    });

    operations.push({ x, y, n });
  }

  return { ops: operations };
}

export function convertOpsToKyoproOps(ops: OperationInput): string {
  if (!ops || typeof ops !== "object" || !Array.isArray(ops.ops)) {
    throw new Error("Invalid operation input format");
  }

  if (ops.ops.length === 0) {
    return "0";
  }

  const lines: string[] = [];
  lines.push(ops.ops.length.toString());

  for (const operation of ops.ops) {
    if (
      typeof operation !== "object" ||
      operation === null ||
      typeof operation.x !== "number" ||
      typeof operation.y !== "number" ||
      typeof operation.n !== "number" ||
      !Number.isInteger(operation.x) ||
      !Number.isInteger(operation.y) ||
      !Number.isInteger(operation.n)
    ) {
      throw new Error("Invalid operation format: x, y, and n must be integers");
    }

    lines.push(`${operation.x} ${operation.y} ${operation.n}`);
  }

  return lines.join("\n");
}

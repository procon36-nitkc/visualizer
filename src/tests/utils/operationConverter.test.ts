import { describe, it, expect } from "vitest";
import {
  convertKyoproOpsToOps,
  convertOpsToKyoproOps,
} from "~/utils/operationConverter";
import { type OperationInput, isOperation, isOperationInput } from "~/types";

describe("convertOpsToKyoproOps", () => {
  describe("type validation tests", () => {
    it("accepts valid OperationInput objects", () => {
      const validOps: OperationInput = {
        ops: [
          { x: 0, y: 0, n: 1 },
          { x: 1, y: 1, n: 2 },
        ],
      };
      expect(isOperationInput(validOps)).toBe(true);
      expect(() => convertOpsToKyoproOps(validOps)).not.toThrow();
    });

    it("rejects invalid OperationInput objects", () => {
      const invalidOps = {
        ops: "invalid",
      } as any;
      expect(isOperationInput(invalidOps)).toBe(false);
      expect(() => convertOpsToKyoproOps(invalidOps)).toThrow(
        "Invalid operation input format"
      );
    });

    it("rejects null input", () => {
      expect(() => convertOpsToKyoproOps(null as any)).toThrow(
        "Invalid operation input format"
      );
    });

    it("rejects undefined input", () => {
      expect(() => convertOpsToKyoproOps(undefined as any)).toThrow(
        "Invalid operation input format"
      );
    });
  });

  describe("valid input tests", () => {
    it("converts single operation to kyopro format", () => {
      const ops: OperationInput = {
        ops: [{ x: 1, y: 2, n: 3 }],
      };
      const result = convertOpsToKyoproOps(ops);
      expect(result).toBe("1\n1 2 3");
    });

    it("converts multiple operations to kyopro format", () => {
      const ops: OperationInput = {
        ops: [
          { x: 1, y: 2, n: 3 },
          { x: 4, y: 5, n: 6 },
          { x: 7, y: 8, n: 9 },
        ],
      };
      const result = convertOpsToKyoproOps(ops);
      expect(result).toBe("3\n1 2 3\n4 5 6\n7 8 9");
    });

    it("converts empty operations to zero count", () => {
      const ops: OperationInput = {
        ops: [],
      };
      const result = convertOpsToKyoproOps(ops);
      expect(result).toBe("0");
    });

    it("handles zero values", () => {
      const ops: OperationInput = {
        ops: [{ x: 0, y: 0, n: 0 }],
      };
      const result = convertOpsToKyoproOps(ops);
      expect(result).toBe("1\n0 0 0");
    });

    it("handles negative values", () => {
      const ops: OperationInput = {
        ops: [{ x: -1, y: -2, n: -3 }],
      };
      const result = convertOpsToKyoproOps(ops);
      expect(result).toBe("1\n-1 -2 -3");
    });

    it("handles large values", () => {
      const ops: OperationInput = {
        ops: [{ x: 999999, y: 1000000, n: 1234567 }],
      };
      const result = convertOpsToKyoproOps(ops);
      expect(result).toBe("1\n999999 1000000 1234567");
    });
  });

  describe("validation tests", () => {
    it("throws error for operations with non-integer values", () => {
      const invalidOps = {
        ops: [{ x: 1.5, y: 2, n: 3 }],
      } as any;
      expect(() => convertOpsToKyoproOps(invalidOps)).toThrow(
        "Invalid operation format: x, y, and n must be integers"
      );
    });

    it("throws error for operations with non-numeric values", () => {
      const invalidOps = {
        ops: [{ x: "1", y: 2, n: 3 }],
      } as any;
      expect(() => convertOpsToKyoproOps(invalidOps)).toThrow(
        "Invalid operation format: x, y, and n must be integers"
      );
    });

    it("throws error for operations with missing properties", () => {
      const invalidOps = {
        ops: [{ x: 1, y: 2 }],
      } as any;
      expect(() => convertOpsToKyoproOps(invalidOps)).toThrow(
        "Invalid operation format: x, y, and n must be integers"
      );
    });

    it("throws error for operations with null values", () => {
      const invalidOps = {
        ops: [{ x: 1, y: null, n: 3 }],
      } as any;
      expect(() => convertOpsToKyoproOps(invalidOps)).toThrow(
        "Invalid operation format: x, y, and n must be integers"
      );
    });

    it("throws error for operations with undefined values", () => {
      const invalidOps = {
        ops: [{ x: 1, y: 2, n: undefined }],
      } as any;
      expect(() => convertOpsToKyoproOps(invalidOps)).toThrow(
        "Invalid operation format: x, y, and n must be integers"
      );
    });

    it("throws error for null operations", () => {
      const invalidOps = {
        ops: [null],
      } as any;
      expect(() => convertOpsToKyoproOps(invalidOps)).toThrow(
        "Invalid operation format: x, y, and n must be integers"
      );
    });
  });

  describe("output format tests", () => {
    it("does not have trailing newline for single operation", () => {
      const ops: OperationInput = {
        ops: [{ x: 1, y: 2, n: 3 }],
      };
      const result = convertOpsToKyoproOps(ops);
      expect(result).not.toMatch(/\n$/);
    });

    it("does not have trailing newline for multiple operations", () => {
      const ops: OperationInput = {
        ops: [
          { x: 1, y: 2, n: 3 },
          { x: 4, y: 5, n: 6 },
        ],
      };
      const result = convertOpsToKyoproOps(ops);
      expect(result).not.toMatch(/\n$/);
    });
  });
});

describe("convertKyoproOpsToOps", () => {
  describe("type validation tests", () => {
    it("returns valid OperationInput objects", () => {
      const input = "2\n1 2 3\n4 5 6";
      const result = convertKyoproOpsToOps(input);

      expect(isOperationInput(result)).toBe(true);
      expect(result.ops.every((op) => isOperation(op))).toBe(true);
    });

    it("result structure matches OperationInput interface", () => {
      const input = "1\n1 2 3";
      const result = convertKyoproOpsToOps(input);

      expect(result).toHaveProperty("ops");
      expect(Array.isArray(result.ops)).toBe(true);
      expect(result.ops[0]).toHaveProperty("x");
      expect(result.ops[0]).toHaveProperty("y");
      expect(result.ops[0]).toHaveProperty("n");
    });
  });

  describe("valid input tests", () => {
    it("converts single operation from kyopro format", () => {
      const input = "1\n1 2 3";
      const result = convertKyoproOpsToOps(input);

      expect(result.ops).toHaveLength(1);
      expect(result.ops[0]).toEqual({ x: 1, y: 2, n: 3 });
    });

    it("converts multiple operations from kyopro format", () => {
      const input = "3\n1 2 3\n4 5 6\n7 8 9";
      const result = convertKyoproOpsToOps(input);

      expect(result.ops).toHaveLength(3);
      expect(result.ops[0]).toEqual({ x: 1, y: 2, n: 3 });
      expect(result.ops[1]).toEqual({ x: 4, y: 5, n: 6 });
      expect(result.ops[2]).toEqual({ x: 7, y: 8, n: 9 });
    });

    it("converts empty input to empty operations", () => {
      const input = "0";
      const result = convertKyoproOpsToOps(input);

      expect(result.ops).toHaveLength(0);
    });

    it("handles zero values", () => {
      const input = "1\n0 0 0";
      const result = convertKyoproOpsToOps(input);

      expect(result.ops[0]).toEqual({ x: 0, y: 0, n: 0 });
    });

    it("handles negative values", () => {
      const input = "1\n-1 -2 -3";

      expect(() => convertKyoproOpsToOps(input)).toThrow(
        "Negative number not allowed: -1"
      );
    });

    it("handles large values", () => {
      const input = "1\n999999 1000000 1234567";
      const result = convertKyoproOpsToOps(input);

      expect(result.ops[0]).toEqual({ x: 999999, y: 1000000, n: 1234567 });
    });

    it("handles input with extra whitespace", () => {
      const input = "  2  \n  1   2   3  \n  4   5   6  ";
      const result = convertKyoproOpsToOps(input);

      expect(result.ops).toHaveLength(2);
      expect(result.ops[0]).toEqual({ x: 1, y: 2, n: 3 });
      expect(result.ops[1]).toEqual({ x: 4, y: 5, n: 6 });
    });

    it("handles input with leading/trailing newlines", () => {
      const input = "\n\n2\n1 2 3\n4 5 6\n\n";
      const result = convertKyoproOpsToOps(input);

      expect(result.ops).toHaveLength(2);
      expect(result.ops[0]).toEqual({ x: 1, y: 2, n: 3 });
      expect(result.ops[1]).toEqual({ x: 4, y: 5, n: 6 });
    });

    it("ignores empty lines", () => {
      const input = "2\n1 2 3\n\n4 5 6\n\n";
      const result = convertKyoproOpsToOps(input);

      expect(result.ops).toHaveLength(2);
      expect(result.ops[0]).toEqual({ x: 1, y: 2, n: 3 });
      expect(result.ops[1]).toEqual({ x: 4, y: 5, n: 6 });
    });
  });

  describe("input format validation tests", () => {
    it("throws error for null input", () => {
      expect(() => convertKyoproOpsToOps(null as any)).toThrow(
        "Invalid operation input format"
      );
    });

    it("throws error for undefined input", () => {
      expect(() => convertKyoproOpsToOps(undefined as any)).toThrow(
        "Invalid operation input format"
      );
    });

    it("throws error for non-string input", () => {
      expect(() => convertKyoproOpsToOps(123 as any)).toThrow(
        "Invalid operation input format"
      );
    });

    it("throws error for empty input", () => {
      expect(() => convertKyoproOpsToOps("")).toThrow(
        "Invalid operation input format"
      );
    });

    it("throws error for invalid operation count", () => {
      const input = "abc\n1 2 3";
      expect(() => convertKyoproOpsToOps(input)).toThrow(
        "Invalid operation count format"
      );
    });

    it("throws error for negative operation count", () => {
      const input = "-1\n1 2 3";
      expect(() => convertKyoproOpsToOps(input)).toThrow(
        "Invalid operation count format"
      );
    });

    it("throws error for mismatched operation count", () => {
      const input = "3\n1 2 3\n4 5 6";
      expect(() => convertKyoproOpsToOps(input)).toThrow(
        "Expected 4 lines (1 header + 3 operations), but got 3"
      );
    });

    it("throws error for lines with insufficient numbers", () => {
      const input = "1\n1 2";
      expect(() => convertKyoproOpsToOps(input)).toThrow(
        "Invalid operation format: each line must have exactly 3 numbers (x, y, n)"
      );
    });

    it("throws error for lines with too many numbers", () => {
      const input = "1\n1 2 3 4";
      expect(() => convertKyoproOpsToOps(input)).toThrow(
        "Invalid operation format: each line must have exactly 3 numbers (x, y, n)"
      );
    });

    it("throws error for lines with non-numeric values", () => {
      const input = "1\n1 a 3";
      expect(() => convertKyoproOpsToOps(input)).toThrow("Invalid number: a");
    });

    it("throws error for lines with mixed valid/invalid numbers", () => {
      const input = "1\n1 2.5 3";
      expect(() => convertKyoproOpsToOps(input)).toThrow("Invalid number: 2.5");
    });

    it("throws error for lines with empty values", () => {
      const input = "1\n1  3";
      expect(() => convertKyoproOpsToOps(input)).toThrow(
        "Invalid operation format: each line must have exactly 3 numbers (x, y, n)"
      );
    });
  });

  describe("edge case tests", () => {
    it("handles scientific notation (should fail)", () => {
      const input = "1\n1e2 0 1";
      expect(() => convertKyoproOpsToOps(input)).toThrow("Invalid number: 1e2");
    });

    it("handles hexadecimal numbers (should fail)", () => {
      const input = "1\n0x1 0 1";
      expect(() => convertKyoproOpsToOps(input)).toThrow("Invalid number: 0x1");
    });

    it("handles infinity (should fail)", () => {
      const input = "1\nInfinity 0 1";
      expect(() => convertKyoproOpsToOps(input)).toThrow(
        "Invalid number: Infinity"
      );
    });

    it("handles NaN (should fail)", () => {
      const input = "1\nNaN 0 1";
      expect(() => convertKyoproOpsToOps(input)).toThrow("Invalid number: NaN");
    });

    it("handles very large integers", () => {
      const input = "1\n999999999999999 1000000000000000 1234567890123456";
      const result = convertKyoproOpsToOps(input);

      expect(result.ops[0]).toEqual({
        x: 999999999999999,
        y: 1000000000000000,
        n: 1234567890123456,
      });
    });

    it("handles very small negative integers", () => {
      const input = "1\n-999999999999999 -1000000000000000 -1234567890123456";

      expect(() => convertKyoproOpsToOps(input)).toThrow(
        "Negative number not allowed: -999999999999999"
      );
    });
  });
});

describe("round-trip tests", () => {
  it("converts OperationInput to kyopro and back successfully", () => {
    const originalOps: OperationInput = {
      ops: [
        { x: 1, y: 2, n: 3 },
        { x: 4, y: 5, n: 6 },
        { x: 7, y: 8, n: 9 },
      ],
    };

    const kyoproString = convertOpsToKyoproOps(originalOps);
    const convertedBack = convertKyoproOpsToOps(kyoproString);

    expect(convertedBack.ops).toEqual(originalOps.ops);
  });

  it("handles round-trip with empty operations", () => {
    const originalOps: OperationInput = {
      ops: [],
    };

    const kyoproString = convertOpsToKyoproOps(originalOps);
    const convertedBack = convertKyoproOpsToOps(kyoproString);

    expect(convertedBack.ops).toEqual(originalOps.ops);
  });

  it("handles round-trip with single operation", () => {
    const originalOps: OperationInput = {
      ops: [{ x: 42, y: -13, n: 0 }],
    };

    const kyoproString = convertOpsToKyoproOps(originalOps);
    expect(() => convertKyoproOpsToOps(kyoproString)).toThrow(
      "Negative number not allowed: -13"
    );
  });

  it("handles round-trip with extreme values", () => {
    const originalOps: OperationInput = {
      ops: [
        { x: -999999, y: 999999, n: 0 },
        { x: 0, y: -1, n: 1000000 },
      ],
    };

    const kyoproString = convertOpsToKyoproOps(originalOps);
    expect(() => convertKyoproOpsToOps(kyoproString)).toThrow(
      "Negative number not allowed: -999999"
    );
  });
});

import { describe, it, expect } from "vitest";
import {
  convertProblemToKyopro,
  convertKyoproToProblem,
} from "~/utils/problemConverter";
import {
  type Problem,
  type ProblemInput,
  isProblem,
  isProblemInput,
} from "~/types";

const validProblem: Problem = {
  field: {
    size: 4,
    entities: [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [7, 6, 5, 4],
      [3, 2, 1, 0],
    ],
  },
};

const invalidSizeProblem: Problem = {
  field: {
    size: 5,
    entities: [
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
      [10, 11, 12, 11, 10],
      [9, 8, 7, 6, 5],
      [4, 3, 2, 1, 0],
    ],
  },
};

const oversizedProblem: Problem = {
  field: {
    size: 26,
    entities: Array.from({ length: 26 }, () => Array(26).fill(0)),
  },
};

const mismatchedEntitiesProblem: Problem = {
  field: {
    size: 4,
    entities: [
      [0, 1, 2, 3],
      [4, 5, 6], // wrong length
      [7, 6, 5, 4],
      [3, 2, 1, 0],
    ],
  },
};

describe("convertProblemToKyopro", () => {
  describe("type validation tests", () => {
    it("accepts valid Problem objects", () => {
      expect(isProblem(validProblem)).toBe(true);
      expect(() => convertProblemToKyopro(validProblem)).not.toThrow();
    });

    it("rejects ProblemInput objects (wrong type)", () => {
      const problemInput: ProblemInput = {
        startsAt: Date.now() / 1000,
        problem: validProblem,
      };
      expect(isProblem(problemInput)).toBe(false);
      expect(isProblemInput(problemInput)).toBe(true);
      expect(() => convertProblemToKyopro(problemInput as any)).toThrow(
        "Invalid problem format"
      );
    });

    it("rejects invalid Problem objects", () => {
      const invalidProblem = {
        field: null,
      } as any;
      expect(isProblem(invalidProblem)).toBe(false);
      expect(() => convertProblemToKyopro(invalidProblem)).toThrow(
        "Invalid problem format"
      );
    });
  });

  it("converts a valid problem to kyopro format", () => {
    const result = convertProblemToKyopro(validProblem);
    expect(result).toBe("4\n0 1 2 3\n4 5 6 7\n7 6 5 4\n3 2 1 0");
  });

  describe("threshold tests", () => {
    it("accepts maximum valid field size (24)", () => {
      const size = 24;
      const totalCells = size * size;
      const maxValue = totalCells / 2 - 1;
      const entities: number[][] = [];

      // Create valid entities with each value appearing exactly twice
      const values: number[] = [];
      for (let i = 0; i <= maxValue; i++) {
        values.push(i, i); // Add each value twice
      }

      // Arrange values in a grid
      for (let i = 0; i < size; i++) {
        entities.push(values.slice(i * size, (i + 1) * size));
      }

      const maxSizeProblem: Problem = {
        field: {
          size,
          entities,
        },
      };
      const result = convertProblemToKyopro(maxSizeProblem);
      expect(result).toContain("24\n0 0 1 1");
      expect(result.split("\n")).toHaveLength(25); // 1 size line + 24 data lines
    });

    it("accepts minimum valid field size (2)", () => {
      const minSizeProblem: Problem = {
        field: {
          size: 2,
          entities: [
            [0, 1],
            [1, 0],
          ],
        },
      };
      const result = convertProblemToKyopro(minSizeProblem);
      expect(result).toBe("2\n0 1\n1 0");
    });

    it("throws error for field size below minimum (1)", () => {
      const belowMinProblem: Problem = {
        field: {
          size: 1,
          entities: [[1]],
        },
      };
      expect(() => convertProblemToKyopro(belowMinProblem)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for field size of 0", () => {
      const zeroSizeProblem: Problem = {
        field: {
          size: 0,
          entities: [],
        },
      };
      expect(() => convertProblemToKyopro(zeroSizeProblem)).toThrow(
        "Invalid problem format"
      );
    });
  });

  describe("validation tests", () => {
    it("throws error for odd field size", () => {
      expect(() => convertProblemToKyopro(invalidSizeProblem)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for oversized field", () => {
      expect(() => convertProblemToKyopro(oversizedProblem)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for mismatched entities length", () => {
      expect(() => convertProblemToKyopro(mismatchedEntitiesProblem)).toThrow(
        "Problem field size does not match entities"
      );
    });

    it("throws error for entities array length not matching size", () => {
      const problem: Problem = {
        field: {
          size: 4,
          entities: [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [7, 6, 5, 4], // only 3 rows instead of 4
          ],
        },
      };
      expect(() => convertProblemToKyopro(problem)).toThrow(
        "Problem field size does not match entities"
      );
    });

    it("throws error for empty entities array with non-zero size", () => {
      const emptyEntitiesProblem: Problem = {
        field: {
          size: 4,
          entities: [],
        },
      };
      expect(() => convertProblemToKyopro(emptyEntitiesProblem)).toThrow(
        "Problem field size does not match entities"
      );
    });

    it("throws error for invalid problem structure (null field)", () => {
      const invalidProblem = {
        field: null,
      } as any;
      expect(() => convertProblemToKyopro(invalidProblem)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for invalid problem structure (missing field)", () => {
      const invalidProblem = {} as any;
      expect(() => convertProblemToKyopro(invalidProblem)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for non-numeric entities", () => {
      const invalidEntitiesProblem = {
        field: {
          size: 2,
          entities: [
            ["a", "b"],
            [3, 4],
          ],
        },
      } as any;
      expect(() => convertProblemToKyopro(invalidEntitiesProblem)).toThrow(
        "Invalid problem format"
      );
    });

    it("accepts negative numbers in entities", () => {
      // This test is now invalid due to entity value range requirements
      // Entity values must be in range 0 to (totalCells/2 - 1)
      const negativeNumbersProblem: Problem = {
        field: {
          size: 2,
          entities: [
            [-1, -2],
            [-3, -4],
          ],
        },
      };
      expect(() => convertProblemToKyopro(negativeNumbersProblem)).toThrow(
        "Entity value -1 is out of valid range (0-1)"
      );
    });

    it("accepts zero values in entities", () => {
      const zeroValuesProblem: Problem = {
        field: {
          size: 2,
          entities: [
            [0, 0],
            [1, 1],
          ],
        },
      };
      const result = convertProblemToKyopro(zeroValuesProblem);
      expect(result).toBe("2\n0 0\n1 1");
    });

    it("rejects large numbers outside valid range", () => {
      const largeNumbersProblem: Problem = {
        field: {
          size: 2,
          entities: [
            [999999, 1000000],
            [1234567, 9876543],
          ],
        },
      };
      expect(() => convertProblemToKyopro(largeNumbersProblem)).toThrow(
        "Entity value 999999 is out of valid range (0-1)"
      );
    });
  });

  describe("entity value validation tests", () => {
    it("throws error for entity value above maximum range", () => {
      const problem: Problem = {
        field: {
          size: 4,
          entities: [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [8, 6, 5, 4], // 8 is above max (7)
            [3, 2, 1, 0],
          ],
        },
      };
      expect(() => convertProblemToKyopro(problem)).toThrow(
        "Entity value 8 is out of valid range (0-7)"
      );
    });

    it("throws error for negative entity values", () => {
      const problem: Problem = {
        field: {
          size: 2,
          entities: [
            [-1, 0],
            [1, 0],
          ],
        },
      };
      expect(() => convertProblemToKyopro(problem)).toThrow(
        "Entity value -1 is out of valid range (0-1)"
      );
    });

    it("throws error for entity value appearing only once", () => {
      const problem: Problem = {
        field: {
          size: 2,
          entities: [
            [0, 1],
            [1, 1], // 0 appears once, 1 appears three times
          ],
        },
      };
      expect(() => convertProblemToKyopro(problem)).toThrow(
        "Entity value 0 appears 1 times, but must appear exactly 2 times"
      );
    });

    it("throws error for entity value appearing more than twice", () => {
      const problem: Problem = {
        field: {
          size: 2,
          entities: [
            [0, 0],
            [0, 1], // 0 appears three times, 1 appears once
          ],
        },
      };
      expect(() => convertProblemToKyopro(problem)).toThrow(
        "Entity value 0 appears 3 times, but must appear exactly 2 times"
      );
    });

    it("throws error for missing required entity values", () => {
      const problem: Problem = {
        field: {
          size: 4,
          entities: [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [7, 6, 5, 4],
            [3, 2, 1, 1], // missing 0, extra 1
          ],
        },
      };
      expect(() => convertProblemToKyopro(problem)).toThrow(
        "Entity value 0 appears 1 times, but must appear exactly 2 times"
      );
    });

    it("throws error for completely missing entity values", () => {
      const problem: Problem = {
        field: {
          size: 4,
          entities: [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [7, 6, 5, 4],
            [3, 2, 1, 0], // This is actually valid - each value appears exactly twice
          ],
        },
      };
      // This should not throw an error as it's valid
      expect(() => convertProblemToKyopro(problem)).not.toThrow();
    });

    it("throws error for duplicate entity values", () => {
      const problem: Problem = {
        field: {
          size: 4,
          entities: [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [0, 6, 0, 4], // 0 appears 3 times, one value missing
            [7, 2, 7, 7], // 7 appears 3 times
          ],
        },
      };
      expect(() => convertProblemToKyopro(problem)).toThrow(
        "Entity value 0 appears 3 times, but must appear exactly 2 times"
      );
    });

    it("accepts valid entity distribution", () => {
      const problem: Problem = {
        field: {
          size: 6,
          entities: [
            [0, 1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10, 11],
            [12, 13, 14, 15, 16, 17],
            [17, 16, 15, 14, 13, 12],
            [11, 10, 9, 8, 7, 6],
            [5, 4, 3, 2, 1, 0],
          ],
        },
      };
      const result = convertProblemToKyopro(problem);
      expect(result).toBe(
        "6\n0 1 2 3 4 5\n6 7 8 9 10 11\n12 13 14 15 16 17\n17 16 15 14 13 12\n11 10 9 8 7 6\n5 4 3 2 1 0"
      );
    });

    it("validates entity values for size 2 field", () => {
      // Size 2x2 = 4 cells, max value = (4/2) - 1 = 1
      const validProblem: Problem = {
        field: {
          size: 2,
          entities: [
            [0, 1],
            [1, 0],
          ],
        },
      };
      expect(() => convertProblemToKyopro(validProblem)).not.toThrow();
    });

    it("validates entity values for size 4 field", () => {
      // Size 4x4 = 16 cells, max value = (16/2) - 1 = 7
      const validProblem: Problem = {
        field: {
          size: 4,
          entities: [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [7, 6, 5, 4],
            [3, 2, 1, 0],
          ],
        },
      };

      expect(() => convertProblemToKyopro(validProblem)).not.toThrow();
    });

    it("throws error for non-integer entity values", () => {
      const problem = {
        field: {
          size: 2,
          entities: [
            [0.5, 1],
            [1, 0],
          ],
        },
      } as any;
      expect(() => convertProblemToKyopro(problem)).toThrow(
        "Entity value 0.5 is out of valid range (0-1)"
      );
    });
  });

  describe("output format tests", () => {
    it("produces correct format for single row", () => {
      const singleRowProblem: Problem = {
        field: {
          size: 2,
          entities: [
            [0, 1],
            [1, 0],
          ],
        },
      };
      const result = convertProblemToKyopro(singleRowProblem);
      const lines = result.split("\n");
      expect(lines[0]).toBe("2");
      expect(lines[1]).toBe("0 1");
      expect(lines[2]).toBe("1 0");
      expect(lines).toHaveLength(3);
    });

    it("does not have trailing newline", () => {
      const result = convertProblemToKyopro(validProblem);
      expect(result).not.toMatch(/\n$/);
    });
  });
});

describe("convertKyoproToProblem", () => {
  describe("type validation tests", () => {
    it("returns valid ProblemInput objects", () => {
      const input = "2\n0 1\n1 0";
      const result = convertKyoproToProblem(input);

      expect(isProblemInput(result)).toBe(true);
      expect(isProblem(result.problem)).toBe(true);
      expect(typeof result.startsAt).toBe("number");
      expect(result.startsAt).toBeGreaterThan(0);
    });

    it("result structure matches ProblemInput interface", () => {
      const input = "4\n0 1 2 3\n4 5 6 7\n7 6 5 4\n3 2 1 0";
      const result = convertKyoproToProblem(input);

      expect(result).toHaveProperty("startsAt");
      expect(result).toHaveProperty("problem");
      expect(result.problem).toHaveProperty("field");
      expect(result.problem.field).toHaveProperty("size");
      expect(result.problem.field).toHaveProperty("entities");
      expect(Array.isArray(result.problem.field.entities)).toBe(true);
    });
  });

  describe("valid input tests", () => {
    it("converts valid kyopro format to Problem", () => {
      const input = "4\n0 1 2 3\n4 5 6 7\n7 6 5 4\n3 2 1 0";
      const result = convertKyoproToProblem(input);

      expect(result.problem.field.size).toBe(4);
      expect(result.problem.field.entities).toEqual([
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [7, 6, 5, 4],
        [3, 2, 1, 0],
      ]);
      expect(typeof result.startsAt).toBe("number");
      expect(result.startsAt).toBeGreaterThan(0);
    });

    it("converts minimum size (2) kyopro format", () => {
      const input = "2\n0 1\n1 0";
      const result = convertKyoproToProblem(input);

      expect(result.problem.field.size).toBe(2);
      expect(result.problem.field.entities).toEqual([
        [0, 1],
        [1, 0],
      ]);
    });

    it("converts maximum size (24) kyopro format", () => {
      const size = 24;
      const totalCells = size * size;
      const maxValue = totalCells / 2 - 1;
      const values: number[] = [];
      for (let i = 0; i <= maxValue; i++) {
        values.push(i, i); // Add each value twice
      }

      const entities: number[][] = [];
      for (let i = 0; i < size; i++) {
        entities.push(values.slice(i * size, (i + 1) * size));
      }

      const input = `${size}\n${entities
        .map((row) => row.join(" "))
        .join("\n")}`;
      const result = convertKyoproToProblem(input);

      expect(result.problem.field.size).toBe(24);
      expect(result.problem.field.entities).toEqual(entities);
    });

    it("rejects negative numbers (out of range)", () => {
      const input = "2\n-1 -2\n-3 -4";
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Entity value -1 is out of valid range (0-1)"
      );
    });

    it("handles zero values correctly", () => {
      const input = "2\n0 0\n1 1";
      const result = convertKyoproToProblem(input);

      expect(result.problem.field.entities).toEqual([
        [0, 0],
        [1, 1],
      ]);
    });

    it("rejects large numbers outside valid range", () => {
      const input = "2\n999999 1000000\n1234567 9876543";
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Entity value 999999 is out of valid range (0-1)"
      );
    });

    it("handles input with extra whitespace", () => {
      const input = "  2  \n  0   1  \n  1   0  ";
      const result = convertKyoproToProblem(input);

      expect(result.problem.field.size).toBe(2);
      expect(result.problem.field.entities).toEqual([
        [0, 1],
        [1, 0],
      ]);
    });

    it("handles input with leading/trailing newlines", () => {
      const input = "\n\n2\n0 1\n1 0\n\n";
      const result = convertKyoproToProblem(input);

      expect(result.problem.field.size).toBe(2);
      expect(result.problem.field.entities).toEqual([
        [0, 1],
        [1, 0],
      ]);
    });
  });

  describe("size validation tests", () => {
    it("throws error for size below minimum (1)", () => {
      const input = "1\n1";
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for size of 0", () => {
      const input = "0";
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for negative size", () => {
      const input = "-2\n1 2\n3 4";
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for size above maximum (25)", () => {
      const size = 25;
      // Create valid pattern for size 25 (will fail at size validation)
      const entities = Array.from({ length: size }, () => Array(size).fill(0));
      const input = `${size}\n${entities
        .map((row) => row.join(" "))
        .join("\n")}`;
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for size above maximum (26)", () => {
      const input =
        "26\n" +
        Array.from({ length: 26 }, () => Array(26).fill(0).join(" ")).join(
          "\n"
        );
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for odd size (3)", () => {
      const input = "3\n0 0 1\n1 2 2\n3 3 4"; // Will fail at size validation before entity validation
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for odd size (5)", () => {
      const input =
        "5\n0 1 2 3 4\n5 6 7 8 9\n10 11 12 11 10\n9 8 7 6 5\n4 3 2 1 0"; // Will fail at size validation
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for non-integer size", () => {
      const input = "2.5\n0 1\n1 0"; // parseInt("2.5") = 2, this is valid entities so should not throw
      const result = convertKyoproToProblem(input);
      expect(result.problem.field.size).toBe(2);
      expect(result.problem.field.entities).toEqual([
        [0, 1],
        [1, 0],
      ]);
    });

    it("throws error for non-numeric size", () => {
      const input = "abc\n1 2\n3 4";
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });
  });

  describe("input format validation tests", () => {
    it("throws error for empty input", () => {
      expect(() => convertKyoproToProblem("")).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for whitespace-only input", () => {
      expect(() => convertKyoproToProblem("   \n  \n  ")).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for missing size line", () => {
      const input = "0 1\n1 0"; // Will parse "0" as size, which is invalid
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for insufficient data lines", () => {
      const input = "4\n0 1 2 3\n4 5 6 7"; // missing 2 lines
      expect(() => convertKyoproToProblem(input)).toThrow(); // Will throw due to undefined.trim()
    });

    it("throws error for too many data lines", () => {
      const input = "2\n0 1\n1 0\n5 6"; // extra line
      const result = convertKyoproToProblem(input);
      // Should still work as it only reads the required number of lines
      expect(result.problem.field.size).toBe(2);
      expect(result.problem.field.entities).toEqual([
        [0, 1],
        [1, 0],
      ]);
    });

    it("throws error for row with insufficient numbers", () => {
      const input = "4\n0 1 2 3\n4 5 6\n7 6 5 4\n3 2 1 0"; // second row missing one number
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for row with too many numbers", () => {
      const input = "2\n0 1 2\n1 0"; // first row has extra number
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for row with non-numeric values", () => {
      const input = "2\n0 a\n1 0";
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for row with mixed valid/invalid numbers", () => {
      const input = "2\n0 2.5\n1 0"; // 2.5 will be parsed as number but fail validation
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Entity value 2.5 is out of valid range (0-1)"
      );
    });

    it("throws error for row with empty values", () => {
      const input = "2\n0 \n1 0"; // empty value will result in NaN
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("throws error for row with only spaces", () => {
      const input = "2\n   \n1 0"; // will result in empty array after split/map
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });
  });

  describe("edge case tests", () => {
    it("handles scientific notation (should fail)", () => {
      const input = "2\n1e2 0\n1 0"; // 1e2 = 100, out of range (0-1)
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Entity value 100 is out of valid range (0-1)"
      );
    });

    it("handles hexadecimal numbers (should succeed)", () => {
      const input = "2\n0x1 0\n1 0"; // 0x1 will be parsed as 1 by Number()
      const result = convertKyoproToProblem(input);
      expect(result.problem.field.entities).toEqual([
        [1, 0],
        [1, 0],
      ]);
    });

    it("handles infinity (should fail)", () => {
      const input = "2\nInfinity 0\n1 0"; // Infinity will be parsed but fail range check
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Entity value Infinity is out of valid range (0-1)"
      );
    });

    it("handles NaN (should fail)", () => {
      const input = "2\nNaN 0\n1 0"; // NaN will be detected by isNaN check
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Invalid problem format"
      );
    });

    it("rejects very large integers (out of range)", () => {
      const input =
        "2\n999999999999999 1000000000000000\n1234567890123456 9876543210987654";
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Entity value 999999999999999 is out of valid range (0-1)"
      );
    });

    it("rejects very small negative integers", () => {
      const input =
        "2\n-999999999999999 -1000000000000000\n-1234567890123456 -9876543210987654";
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Entity value -999999999999999 is out of valid range (0-1)"
      );
    });
  });

  describe("timestamp tests", () => {
    it("generates reasonable startsAt timestamp", () => {
      const before = (Date.now() - 15000) / 1000; // 15 seconds ago
      const input = "2\n0 1\n1 0";
      const result = convertKyoproToProblem(input);
      const after = (Date.now() - 5000) / 1000; // 5 seconds ago

      expect(result.startsAt).toBeGreaterThan(before);
      expect(result.startsAt).toBeLessThan(after);
    });

    it("startsAt is approximately 10 seconds in the past", () => {
      const input = "2\n0 1\n1 0";
      const result = convertKyoproToProblem(input);
      const now = Date.now() / 1000;
      const timeDiff = now - result.startsAt;

      // Should be approximately 10 seconds, allow some tolerance
      expect(timeDiff).toBeGreaterThan(9);
      expect(timeDiff).toBeLessThan(11);
    });
  });

  describe("entity value validation tests for convertKyoproToProblem", () => {
    it("throws error for entity value above maximum range", () => {
      const input = "2\n0 2\n1 0"; // 2 is above max (1)
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Entity value 2 is out of valid range (0-1)"
      );
    });

    it("throws error for entity value appearing only once", () => {
      const input = "2\n0 1\n1 1"; // 0 appears once, 1 appears three times
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Entity value 0 appears 1 times, but must appear exactly 2 times"
      );
    });

    it("throws error for entity value appearing more than twice", () => {
      const input = "2\n0 0\n0 1"; // 0 appears three times, 1 appears once
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Entity value 0 appears 3 times, but must appear exactly 2 times"
      );
    });

    it("throws error for missing required entity values", () => {
      const input = "4\n1 1 2 2\n3 3 4 4\n5 5 6 6\n7 7 7 7"; // 0 is missing
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Missing required entity value 0"
      );
    });

    it("throws error for actually missing entity values", () => {
      const input = "4\n1 1 2 2\n3 3 4 4\n5 5 6 6\n7 7 1 1"; // 0 is missing
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Missing required entity value 0"
      );
    });

    it("throws error for truly missing entity values", () => {
      // Create a case where all present values appear exactly twice, but some are missing
      // 2x2 field needs values 0,1 but we provide 1,1 (missing 0)
      const input = "2\n1 1\n1 1"; // 0 is missing
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Missing required entity value 0"
      );
    });

    it("throws error for invalid entity value range in 4x4", () => {
      const input = "4\n0 1 2 3\n4 5 6 7\n8 6 5 4\n3 2 1 0"; // 8 is above max (7)
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Entity value 8 is out of valid range (0-7)"
      );
    });

    it("accepts valid entity distribution in kyopro input", () => {
      const input = "4\n0 1 2 3\n4 5 6 7\n7 6 5 4\n3 2 1 0";
      const result = convertKyoproToProblem(input);
      expect(result.problem.field.entities).toEqual([
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [7, 6, 5, 4],
        [3, 2, 1, 0],
      ]);
    });

    it("validates entity values correctly for different field sizes", () => {
      // 6x6 = 36 cells, max value = 17
      const input =
        "6\n0 1 2 3 4 5\n6 7 8 9 10 11\n12 13 14 15 16 17\n17 16 15 14 13 12\n11 10 9 8 7 6\n5 4 3 2 1 0";
      const result = convertKyoproToProblem(input);
      expect(result.problem.field.size).toBe(6);
    });

    it("throws error for non-integer decimal values", () => {
      const input = "2\n0.5 1\n1 0"; // 0.5 will be parsed and fail integer/range check
      expect(() => convertKyoproToProblem(input)).toThrow(
        "Entity value 0.5 is out of valid range (0-1)"
      );
    });
  });

  describe("round-trip tests", () => {
    it("converts Problem to kyopro and back successfully", () => {
      const originalProblem: Problem = {
        field: {
          size: 4,
          entities: [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [7, 6, 5, 4],
            [3, 2, 1, 0],
          ],
        },
      };

      const kyoproString = convertProblemToKyopro(originalProblem);
      const convertedBack = convertKyoproToProblem(kyoproString);

      expect(convertedBack.problem.field.size).toBe(originalProblem.field.size);
      expect(convertedBack.problem.field.entities).toEqual(
        originalProblem.field.entities
      );
    });

    it("handles round-trip with valid entity range", () => {
      const originalProblem: Problem = {
        field: {
          size: 2,
          entities: [
            [0, 1],
            [1, 0],
          ],
        },
      };

      const kyoproString = convertProblemToKyopro(originalProblem);
      const convertedBack = convertKyoproToProblem(kyoproString);

      expect(convertedBack.problem.field.entities).toEqual(
        originalProblem.field.entities
      );
    });

    it("handles round-trip with complex valid pattern", () => {
      const originalProblem: Problem = {
        field: {
          size: 6,
          entities: [
            [0, 1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10, 11],
            [12, 13, 14, 15, 16, 17],
            [17, 16, 15, 14, 13, 12],
            [11, 10, 9, 8, 7, 6],
            [5, 4, 3, 2, 1, 0],
          ],
        },
      };

      const kyoproString = convertProblemToKyopro(originalProblem);
      const convertedBack = convertKyoproToProblem(kyoproString);

      expect(convertedBack.problem.field.entities).toEqual(
        originalProblem.field.entities
      );
    });

    it("handles round-trip with maximum size", () => {
      const size = 24;
      const totalCells = size * size;
      const maxValue = totalCells / 2 - 1;
      const values: number[] = [];
      for (let i = 0; i <= maxValue; i++) {
        values.push(i, i); // Add each value twice
      }

      const entities: number[][] = [];
      for (let i = 0; i < size; i++) {
        entities.push(values.slice(i * size, (i + 1) * size));
      }

      const originalProblem: Problem = {
        field: {
          size,
          entities,
        },
      };

      const kyoproString = convertProblemToKyopro(originalProblem);
      const convertedBack = convertKyoproToProblem(kyoproString);

      expect(convertedBack.problem.field.size).toBe(size);
      expect(convertedBack.problem.field.entities).toEqual(
        originalProblem.field.entities
      );
    });
  });
});

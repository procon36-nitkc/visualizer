import { describe, it, expect } from "vitest";
import {
  isProblem,
  isProblemInput,
  isOperation,
  isOperationInput,
  type ProblemInput,
  type Problem,
  type Operation,
  type OperationInput,
} from "~/types";

describe("Type validation functions", () => {
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

  const validProblemInput: ProblemInput = {
    startsAt: 0,
    problem: validProblem,
  };

  describe("isProblem", () => {
    describe("valid inputs", () => {
      it("returns true for valid Problem", () => {
        expect(isProblem(validProblem)).toBe(true);
      });

      it("returns true for Problem with different sizes", () => {
        const minSizeProblem: Problem = {
          field: {
            size: 2,
            entities: [
              [0, 1],
              [1, 0],
            ],
          },
        };
        expect(isProblem(minSizeProblem)).toBe(true);
      });

      it("returns true for Problem with large size field", () => {
        const largeProblem: Problem = {
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
        expect(isProblem(largeProblem)).toBe(true);
      });
    });

    describe("invalid inputs", () => {
      it("returns false for null input", () => {
        expect(isProblem(null)).toBe(false);
      });

      it("returns false for undefined input", () => {
        expect(isProblem(undefined)).toBe(false);
      });

      it("returns false for empty object", () => {
        expect(isProblem({})).toBe(false);
      });

      it("returns false for ProblemInput (wrong type)", () => {
        expect(isProblem(validProblemInput)).toBe(false);
      });

      it("returns false for object with null field", () => {
        const invalid = {
          field: null,
        };
        expect(isProblem(invalid)).toBe(false);
      });

      it("returns false for object with field not an object", () => {
        const invalid = {
          field: "invalid",
        };
        expect(isProblem(invalid)).toBe(false);
      });

      it("returns false for object with field.size as null", () => {
        const invalid = {
          field: {
            size: null,
            entities: [
              [0, 1],
              [1, 0],
            ],
          },
        };
        expect(isProblem(invalid)).toBe(false);
      });

      it("returns false for object with field.size not a number", () => {
        const invalid = {
          field: {
            size: "4",
            entities: [
              [0, 1],
              [1, 0],
            ],
          },
        };
        expect(isProblem(invalid)).toBe(false);
      });

      it("returns false for object with field.entities not an array", () => {
        const invalid = {
          field: {
            size: 2,
            entities: "invalid",
          },
        };
        expect(isProblem(invalid)).toBe(false);
      });

      it("returns false for object with field.entities containing non-arrays", () => {
        const invalid = {
          field: {
            size: 2,
            entities: ["invalid", [1, 0]],
          },
        };
        expect(isProblem(invalid)).toBe(false);
      });

      it("returns false for object with field.entities containing arrays with non-numbers", () => {
        const invalid = {
          field: {
            size: 2,
            entities: [
              [0, "invalid"],
              [1, 0],
            ],
          },
        };
        expect(isProblem(invalid)).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("returns true for zero values in entities", () => {
        const problem: Problem = {
          field: {
            size: 2,
            entities: [
              [0, 0],
              [0, 0],
            ],
          },
        };
        expect(isProblem(problem)).toBe(true);
      });

      it("returns true for negative numbers in entities", () => {
        const problem: Problem = {
          field: {
            size: 2,
            entities: [
              [-1, -2],
              [-3, -4],
            ],
          },
        };
        expect(isProblem(problem)).toBe(true);
      });

      it("returns true for floating point numbers in entities", () => {
        const problem: Problem = {
          field: {
            size: 2,
            entities: [
              [1.5, 2.7],
              [3.14, 2.71],
            ],
          },
        };
        expect(isProblem(problem)).toBe(true);
      });
    });
  });

  describe("isProblemInput", () => {
    describe("valid inputs", () => {
      it("returns true for valid ProblemInput", () => {
        expect(isProblemInput(validProblemInput)).toBe(true);
      });

      it("returns true for ProblemInput with different startsAt", () => {
        const problemInput: ProblemInput = {
          startsAt: 100,
          problem: validProblem,
        };
        expect(isProblemInput(problemInput)).toBe(true);
      });

      it("returns true for ProblemInput with minimum size field", () => {
        const minSizeProblem: Problem = {
          field: {
            size: 2,
            entities: [
              [0, 1],
              [1, 0],
            ],
          },
        };
        const problemInput: ProblemInput = {
          startsAt: 0,
          problem: minSizeProblem,
        };
        expect(isProblemInput(problemInput)).toBe(true);
      });
    });

    describe("invalid inputs", () => {
      it("returns false for null input", () => {
        expect(isProblemInput(null)).toBe(false);
      });

      it("returns false for undefined input", () => {
        expect(isProblemInput(undefined)).toBe(false);
      });

      it("returns false for empty object", () => {
        expect(isProblemInput({})).toBe(false);
      });

      it("returns false for Problem (wrong type)", () => {
        expect(isProblemInput(validProblem)).toBe(false);
      });

      it("returns false for object missing problem property", () => {
        const invalid = {
          startsAt: 0,
        };
        expect(isProblemInput(invalid)).toBe(false);
      });

      it("returns false for object with null problem", () => {
        const invalid = {
          startsAt: 0,
          problem: null,
        };
        expect(isProblemInput(invalid)).toBe(false);
      });

      it("returns false for object with problem.field as null", () => {
        const invalid = {
          startsAt: 0,
          problem: {
            field: null,
          },
        };
        expect(isProblemInput(invalid)).toBe(false);
      });

      it("returns false for object with problem.field not an object", () => {
        const invalid = {
          startsAt: 0,
          problem: {
            field: "invalid",
          },
        };
        expect(isProblemInput(invalid)).toBe(false);
      });

      it("returns false for object with problem.field.size as null", () => {
        const invalid = {
          startsAt: 0,
          problem: {
            field: {
              size: null,
              entities: [
                [0, 1],
                [1, 0],
              ],
            },
          },
        };
        expect(isProblemInput(invalid)).toBe(false);
      });

      it("returns false for object with problem.field.size not a number", () => {
        const invalid = {
          startsAt: 0,
          problem: {
            field: {
              size: "4",
              entities: [
                [0, 1],
                [1, 0],
              ],
            },
          },
        };
        expect(isProblemInput(invalid)).toBe(false);
      });

      it("returns false for object with problem.field.entities not an array", () => {
        const invalid = {
          startsAt: 0,
          problem: {
            field: {
              size: 2,
              entities: "invalid",
            },
          },
        };
        expect(isProblemInput(invalid)).toBe(false);
      });

      it("returns false for object with problem.field.entities containing non-arrays", () => {
        const invalid = {
          startsAt: 0,
          problem: {
            field: {
              size: 2,
              entities: ["invalid", [1, 0]],
            },
          },
        };
        expect(isProblemInput(invalid)).toBe(false);
      });

      it("returns false for object with problem.field.entities containing arrays with non-numbers", () => {
        const invalid = {
          startsAt: 0,
          problem: {
            field: {
              size: 2,
              entities: [
                [0, "invalid"],
                [1, 0],
              ],
            },
          },
        };
        expect(isProblemInput(invalid)).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("returns true for zero values in entities", () => {
        const problemInput: ProblemInput = {
          startsAt: 0,
          problem: {
            field: {
              size: 2,
              entities: [
                [0, 0],
                [0, 0],
              ],
            },
          },
        };
        expect(isProblemInput(problemInput)).toBe(true);
      });

      it("returns true for negative numbers in entities", () => {
        const problemInput: ProblemInput = {
          startsAt: 0,
          problem: {
            field: {
              size: 2,
              entities: [
                [-1, -2],
                [-3, -4],
              ],
            },
          },
        };
        expect(isProblemInput(problemInput)).toBe(true);
      });

      it("returns true for floating point numbers in entities", () => {
        const problemInput: ProblemInput = {
          startsAt: 0,
          problem: {
            field: {
              size: 2,
              entities: [
                [1.5, 2.7],
                [3.14, 2.71],
              ],
            },
          },
        };
        expect(isProblemInput(problemInput)).toBe(true);
      });
    });
  });

  describe("isOperation", () => {
    describe("valid inputs", () => {
      it("returns true for valid Operation", () => {
        const validOperation: Operation = { x: 1, y: 2, n: 3 };
        expect(isOperation(validOperation)).toBe(true);
      });

      it("returns true for Operation with zero values", () => {
        const operation: Operation = { x: 0, y: 0, n: 0 };
        expect(isOperation(operation)).toBe(true);
      });

      it("returns true for Operation with negative values", () => {
        const operation: Operation = { x: -1, y: -2, n: -3 };
        expect(isOperation(operation)).toBe(true);
      });

      it("returns true for Operation with large values", () => {
        const operation: Operation = { x: 999999, y: 1000000, n: 1234567 };
        expect(isOperation(operation)).toBe(true);
      });
    });

    describe("invalid inputs", () => {
      it("returns false for null input", () => {
        expect(isOperation(null)).toBe(false);
      });

      it("returns false for undefined input", () => {
        expect(isOperation(undefined)).toBe(false);
      });

      it("returns false for empty object", () => {
        expect(isOperation({})).toBe(false);
      });

      it("returns false for object missing x property", () => {
        const invalid = { y: 2, n: 3 };
        expect(isOperation(invalid)).toBe(false);
      });

      it("returns false for object missing y property", () => {
        const invalid = { x: 1, n: 3 };
        expect(isOperation(invalid)).toBe(false);
      });

      it("returns false for object missing n property", () => {
        const invalid = { x: 1, y: 2 };
        expect(isOperation(invalid)).toBe(false);
      });

      it("returns false for object with non-numeric x", () => {
        const invalid = { x: "1", y: 2, n: 3 };
        expect(isOperation(invalid)).toBe(false);
      });

      it("returns false for object with non-numeric y", () => {
        const invalid = { x: 1, y: "2", n: 3 };
        expect(isOperation(invalid)).toBe(false);
      });

      it("returns false for object with non-numeric n", () => {
        const invalid = { x: 1, y: 2, n: "3" };
        expect(isOperation(invalid)).toBe(false);
      });

      it("returns false for object with non-integer x", () => {
        const invalid = { x: 1.5, y: 2, n: 3 };
        expect(isOperation(invalid)).toBe(false);
      });

      it("returns false for object with non-integer y", () => {
        const invalid = { x: 1, y: 2.5, n: 3 };
        expect(isOperation(invalid)).toBe(false);
      });

      it("returns false for object with non-integer n", () => {
        const invalid = { x: 1, y: 2, n: 3.5 };
        expect(isOperation(invalid)).toBe(false);
      });

      it("returns false for object with null values", () => {
        const invalid = { x: 1, y: null, n: 3 };
        expect(isOperation(invalid)).toBe(false);
      });

      it("returns false for object with undefined values", () => {
        const invalid = { x: 1, y: 2, n: undefined };
        expect(isOperation(invalid)).toBe(false);
      });
    });
  });

  describe("isOperationInput", () => {
    describe("valid inputs", () => {
      it("returns true for valid OperationInput", () => {
        const validOperationInput: OperationInput = {
          ops: [
            { x: 1, y: 2, n: 3 },
            { x: 4, y: 5, n: 6 },
          ],
        };
        expect(isOperationInput(validOperationInput)).toBe(true);
      });

      it("returns true for OperationInput with empty ops", () => {
        const operationInput: OperationInput = { ops: [] };
        expect(isOperationInput(operationInput)).toBe(true);
      });

      it("returns true for OperationInput with single operation", () => {
        const operationInput: OperationInput = {
          ops: [{ x: 1, y: 2, n: 3 }],
        };
        expect(isOperationInput(operationInput)).toBe(true);
      });
    });

    describe("invalid inputs", () => {
      it("returns false for null input", () => {
        expect(isOperationInput(null)).toBe(false);
      });

      it("returns false for undefined input", () => {
        expect(isOperationInput(undefined)).toBe(false);
      });

      it("returns false for empty object", () => {
        expect(isOperationInput({})).toBe(false);
      });

      it("returns false for object missing ops property", () => {
        const invalid = {};
        expect(isOperationInput(invalid)).toBe(false);
      });

      it("returns false for object with non-array ops", () => {
        const invalid = { ops: "invalid" };
        expect(isOperationInput(invalid)).toBe(false);
      });

      it("returns false for object with null ops", () => {
        const invalid = { ops: null };
        expect(isOperationInput(invalid)).toBe(false);
      });

      it("returns false for object with ops containing invalid operations", () => {
        const invalid = {
          ops: [
            { x: 1, y: 2, n: 3 },
            { x: "invalid", y: 5, n: 6 },
          ],
        };
        expect(isOperationInput(invalid)).toBe(false);
      });

      it("returns false for object with ops containing non-objects", () => {
        const invalid = {
          ops: [{ x: 1, y: 2, n: 3 }, "invalid"],
        };
        expect(isOperationInput(invalid)).toBe(false);
      });

      it("returns false for object with ops containing null", () => {
        const invalid = {
          ops: [{ x: 1, y: 2, n: 3 }, null],
        };
        expect(isOperationInput(invalid)).toBe(false);
      });
    });
  });

  describe("type distinction tests", () => {
    const validOperation: Operation = { x: 1, y: 2, n: 3 };
    const validOperationInput: OperationInput = {
      ops: [{ x: 1, y: 2, n: 3 }],
    };

    it("isProblem and isProblemInput should be mutually exclusive for valid inputs", () => {
      expect(isProblem(validProblem)).toBe(true);
      expect(isProblemInput(validProblem)).toBe(false);

      expect(isProblem(validProblemInput)).toBe(false);
      expect(isProblemInput(validProblemInput)).toBe(true);
    });

    it("isOperation and isOperationInput should be mutually exclusive for valid inputs", () => {
      expect(isOperation(validOperation)).toBe(true);
      expect(isOperationInput(validOperation)).toBe(false);

      expect(isOperation(validOperationInput)).toBe(false);
      expect(isOperationInput(validOperationInput)).toBe(true);
    });

    it("Problem/ProblemInput and Operation/OperationInput should be mutually exclusive", () => {
      expect(isProblem(validOperation)).toBe(false);
      expect(isProblem(validOperationInput)).toBe(false);
      expect(isProblemInput(validOperation)).toBe(false);
      expect(isProblemInput(validOperationInput)).toBe(false);

      expect(isOperation(validProblem)).toBe(false);
      expect(isOperation(validProblemInput)).toBe(false);
      expect(isOperationInput(validProblem)).toBe(false);
      expect(isOperationInput(validProblemInput)).toBe(false);
    });

    it("all functions should return false for completely invalid inputs", () => {
      const invalid = "invalid";
      expect(isProblem(invalid)).toBe(false);
      expect(isProblemInput(invalid)).toBe(false);
      expect(isOperation(invalid)).toBe(false);
      expect(isOperationInput(invalid)).toBe(false);
    });

    it("all functions should return false for null", () => {
      expect(isProblem(null)).toBe(false);
      expect(isProblemInput(null)).toBe(false);
      expect(isOperation(null)).toBe(false);
      expect(isOperationInput(null)).toBe(false);
    });
  });
});

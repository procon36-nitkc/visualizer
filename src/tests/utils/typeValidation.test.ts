import { describe, it, expect } from "vitest";
import {
  isProblem,
  isProblemInput,
  type ProblemInput,
  type Problem,
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

  describe("type distinction tests", () => {
    it("isProblem and isProblemInput should be mutually exclusive for valid inputs", () => {
      expect(isProblem(validProblem)).toBe(true);
      expect(isProblemInput(validProblem)).toBe(false);

      expect(isProblem(validProblemInput)).toBe(false);
      expect(isProblemInput(validProblemInput)).toBe(true);
    });

    it("both should return false for completely invalid inputs", () => {
      const invalid = "invalid";
      expect(isProblem(invalid)).toBe(false);
      expect(isProblemInput(invalid)).toBe(false);
    });

    it("both should return false for null", () => {
      expect(isProblem(null)).toBe(false);
      expect(isProblemInput(null)).toBe(false);
    });
  });
});

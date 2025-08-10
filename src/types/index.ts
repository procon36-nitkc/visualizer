export interface OperationInput {
  ops: Operation[];
}
export interface Operation {
  x: number;
  y: number;
  n: number;
}

export interface Problem {
  field: {
    size: number;
    entities: Entity[][];
  };
}

export const isProblemInput = (problem: any): problem is ProblemInput => {
  return (
    problem !== null &&
    problem !== undefined &&
    typeof problem === "object" &&
    problem.problem !== null &&
    problem.problem !== undefined &&
    typeof problem.problem === "object" &&
    problem.problem.field !== null &&
    typeof problem.problem.field === "object" &&
    problem.problem.field.size !== null &&
    typeof problem.problem.field.size === "number" &&
    Array.isArray(problem.problem.field.entities) &&
    problem.problem.field.entities.every(
      (row: any[]) =>
        Array.isArray(row) && row.every((entity) => typeof entity === "number")
    )
  );
};

export const isProblem = (problem: any): problem is Problem => {
  return (
    problem !== null &&
    problem !== undefined &&
    typeof problem === "object" &&
    problem.field !== null &&
    typeof problem.field === "object" &&
    problem.field.size !== null &&
    typeof problem.field.size === "number" &&
    Array.isArray(problem.field.entities) &&
    problem.field.entities.every(
      (row: any[]) =>
        Array.isArray(row) && row.every((entity) => typeof entity === "number")
    )
  );
};

export interface ProblemInput {
  startsAt: number;
  problem: Problem;
}

export type Entity = number;

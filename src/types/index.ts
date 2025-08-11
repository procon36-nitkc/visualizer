export interface OperationInput {
  ops: Operation[];
}
export interface Operation {
  x: number;
  y: number;
  n: number;
}

export const isOperation = (operation: any): operation is Operation => {
  return (
    operation !== null &&
    operation !== undefined &&
    typeof operation === "object" &&
    typeof operation.x === "number" &&
    typeof operation.y === "number" &&
    typeof operation.n === "number" &&
    Number.isInteger(operation.x) &&
    Number.isInteger(operation.y) &&
    Number.isInteger(operation.n)
  );
};

export const isOperationInput = (
  operationInput: any
): operationInput is OperationInput => {
  return (
    operationInput !== null &&
    operationInput !== undefined &&
    typeof operationInput === "object" &&
    Array.isArray(operationInput.ops) &&
    operationInput.ops.every((op: any) => isOperation(op))
  );
};

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
    isProblem(problem.problem)
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

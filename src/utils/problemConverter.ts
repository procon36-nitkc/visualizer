import {
  isProblem,
  type Problem,
  type ProblemInput,
} from "~/types";

export function convertProblemToKyopro(problem: Problem): string {
  if (
    !problem ||
    !isProblem(problem) ||
    problem.field.size % 2 !== 0 ||
    problem.field.size > 24 ||
    problem.field.size < 2
  ) {
    throw new Error("Invalid problem format");
  }

  if (
    problem.field.entities.length !== problem.field.size ||
    problem.field.entities.some((row) => row.length !== problem.field.size)
  ) {
    throw new Error("Problem field size does not match entities");
  }

  // Validate entity values and count
  const totalCells = problem.field.size * problem.field.size;
  const maxEntityValue = totalCells / 2 - 1;
  const entityCount = new Map<number, number>();

  for (const row of problem.field.entities) {
    for (const entity of row) {
      if (!Number.isInteger(entity) || entity < 0 || entity > maxEntityValue) {
        throw new Error(
          `Entity value ${entity} is out of valid range (0-${maxEntityValue})`
        );
      }
      entityCount.set(entity, (entityCount.get(entity) || 0) + 1);
    }
  }

  // Check that all values from 0 to maxEntityValue are present first
  for (let i = 0; i <= maxEntityValue; i++) {
    if (!entityCount.has(i)) {
      throw new Error(`Missing required entity value ${i}`);
    }
  }

  // Then check that each entity value appears exactly twice
  for (const [value, count] of entityCount.entries()) {
    if (count !== 2) {
      throw new Error(
        `Entity value ${value} appears ${count} times, but must appear exactly 2 times`
      );
    }
  }

  let kyoproString = "";
  kyoproString += `${problem.field.size}\n`;
  for (let i = 0; i < problem.field.entities.length; i++) {
    kyoproString += problem.field.entities[i].join(" ");
    if (i !== problem.field.entities.length - 1) {
      kyoproString += "\n";
    }
  }

  return kyoproString;
}

export function convertKyoproToProblem(rawInput: string): ProblemInput {
  const lines = rawInput.trim().split("\n");
  const size = parseInt(lines[0], 10);

  if (isNaN(size) || size < 2 || size > 24 || size % 2 !== 0) {
    throw new Error("Invalid problem format");
  }

  const entities: number[][] = [];
  for (let i = 1; i <= size; i++) {
    const row = lines[i].trim().split(/\s+/).map(Number);
    if (row.length !== size || row.some(isNaN)) {
      throw new Error("Invalid problem format");
    }
    entities.push(row);
  }

  // Validate entity values and count
  const totalCells = size * size;
  const maxEntityValue = totalCells / 2 - 1;
  const entityCount = new Map<number, number>();

  for (const row of entities) {
    for (const entity of row) {
      if (!Number.isInteger(entity) || entity < 0 || entity > maxEntityValue) {
        throw new Error(
          `Entity value ${entity} is out of valid range (0-${maxEntityValue})`
        );
      }
      entityCount.set(entity, (entityCount.get(entity) || 0) + 1);
    }
  }

  // Check that all values from 0 to maxEntityValue are present first
  for (let i = 0; i <= maxEntityValue; i++) {
    if (!entityCount.has(i)) {
      throw new Error(`Missing required entity value ${i}`);
    }
  }

  // Then check that each entity value appears exactly twice
  for (const [value, count] of entityCount.entries()) {
    if (count !== 2) {
      throw new Error(
        `Entity value ${value} appears ${count} times, but must appear exactly 2 times`
      );
    }
  }

  return {
    startsAt: (Date.now() - 10000) / 1000, // UNIX timestamp 10 seconds ago
    problem: {
      field: {
        size,
        entities,
      },
    },
  };
}

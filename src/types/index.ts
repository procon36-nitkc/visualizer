export interface Operation {
  x: number;
  y: number;
  n: number;
}


export interface Problem {
  field: {
    entities: number[][];
  };
}

export interface ProblemInput {
  startsAt: number;
  problem: Problem;
}

export type Entity = number;

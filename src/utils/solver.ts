/**
 * Solver for the 24-point game.
 */

export type Operator = '+' | '-' | '*' | '/';

export function solve24(numbers: number[]): string | null {
  const ops: Operator[] = ['+', '-', '*', '/'];

  function evaluate(a: number, b: number, op: Operator): number {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
    }
  }

  const n = numbers.length;
  if (n === 1) {
    if (Math.abs(numbers[0] - 24) < 1e-6) {
      return numbers[0].toString();
    }
    return null;
  }

  // Permutations of indices
  const indices = Array.from({ length: n }, (_, i) => i);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;

      const remainingNumbers: number[] = [];
      for (let k = 0; k < n; k++) {
        if (k !== i && k !== j) {
          remainingNumbers.push(numbers[k]);
        }
      }

      for (const op of ops) {
        const res = evaluate(numbers[i], numbers[j], op);
        if (isNaN(res)) continue;

        // We don't need the full expression tree for just checking solvability,
        // but it's helpful for hints.
        // For simplicity, we just return true/false or a simple string.
        const result = solve24([...remainingNumbers, res]);
        if (result) return `(${numbers[i]} ${op} ${numbers[j]}) ...`; // Simplified
      }
    }
  }

  return null;
}

/**
 * More robust solver that returns the full expression.
 */
export function getSolution(numbers: number[]): string | null {
  const ops: Operator[] = ['+', '-', '*', '/'];

  interface Node {
    val: number;
    expr: string;
  }

  const nodes: Node[] = numbers.map(n => ({ val: n, expr: n.toString() }));

  function backtrack(currentNodes: Node[]): string | null {
    if (currentNodes.length === 1) {
      if (Math.abs(currentNodes[0].val - 24) < 1e-6) {
        return currentNodes[0].expr;
      }
      return null;
    }

    for (let i = 0; i < currentNodes.length; i++) {
      for (let j = 0; j < currentNodes.length; j++) {
        if (i === j) continue;

        const nextNodesBase = currentNodes.filter((_, idx) => idx !== i && idx !== j);

        for (const op of ops) {
          const a = currentNodes[i];
          const b = currentNodes[j];
          
          // Optimization: avoid redundant operations
          if ((op === '+' || op === '*') && i > j) continue;

          let val = 0;
          if (op === '+') val = a.val + b.val;
          else if (op === '-') val = a.val - b.val;
          else if (op === '*') val = a.val * b.val;
          else if (op === '/') {
            if (Math.abs(b.val) < 1e-9) continue;
            val = a.val / b.val;
          }

          const res = backtrack([...nextNodesBase, { val, expr: `(${a.expr}${op}${b.expr})` }]);
          if (res) return res;
        }
      }
    }
    return null;
  }

  return backtrack(nodes);
}

export function generateSolvablePuzzle(): number[] {
  while (true) {
    const nums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1);
    if (getSolution(nums)) return nums;
  }
}

export const regressionPoints = [[0, 1], [1, 2], [2, 2], [3, 4], [4, 4]];
export const treePoints = [[1, 0], [2, 0], [3, 1], [4, 0], [5, 1], [6, 1]];
export const boostingPoints = [[0, 1], [1, 1], [2, 3], [3, 3], [4, 2], [5, 2], [6, 4], [7, 4]];
export function mean(values: number[]) { return values.reduce((s, v) => s + v, 0) / values.length; }
export function sigmoid(z: number) { return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)); }
export function regressionSSE(slope: number) { return regressionPoints.reduce((s, [x, y]) => s + (y - (1 + slope * x)) ** 2, 0); }
export function gini(labels: number[]) {
  if (!labels.length) return 0;
  const p = mean(labels);
  return 2 * p * (1 - p);
}
export function splitStats(threshold: number) {
  const left = treePoints.filter(([x]) => x <= threshold).map(([, y]) => y);
  const right = treePoints.filter(([x]) => x > threshold).map(([, y]) => y);
  const weighted = (left.length * gini(left) + right.length * gini(right)) / treePoints.length;
  return { left: mean(left), right: mean(right), gain: 0.5 - weighted, weighted };
}
export function forestVariance(trees: number, correlation: number) { return correlation + (1 - correlation) / trees; }
export function fitBoosting(rounds: number, rate: number) {
  const predictions = boostingPoints.map(() => mean(boostingPoints.map(([, y]) => y)));
  const losses: number[] = [];
  for (let round = 0; round < rounds; round++) {
    const residuals = boostingPoints.map(([, y], i) => y - predictions[i]);
    let best = { loss: Infinity, split: 0, left: 0, right: 0 };
    for (let split = 1; split < boostingPoints.length; split++) {
      const left = mean(residuals.slice(0, split));
      const right = mean(residuals.slice(split));
      const loss = residuals.reduce((s, r, i) => s + (r - (i < split ? left : right)) ** 2, 0);
      if (loss < best.loss) best = { loss, split, left, right };
    }
    predictions.forEach((_, i) => { predictions[i] += rate * (i < best.split ? best.left : best.right); });
    losses.push(mean(boostingPoints.map(([, y], i) => (y - predictions[i]) ** 2)));
  }
  return { predictions, losses };
}

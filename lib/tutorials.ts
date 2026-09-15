export const tutorialSections = [
  ["intuition", "Intuition & scope"], ["notation", "Symbols & notation"],
  ["mathematics", "Mathematical foundations"], ["learning", "How learning works"],
  ["example", "Worked example & figure"], ["controls", "Algorithm controls"],
  ["assumptions", "Assumptions & guarantees"], ["limitations", "Limitations & vulnerabilities"],
  ["applications", "Applications & evidence"], ["comparison", "Choosing this algorithm"],
  ["implementation", "Implementation reference"], ["references", "Sources & further reading"],
] as const;

export const algorithms = [
  { slug: "linear-regression", title: "Linear regression", family: "Linear methods", task: "Regression", summary: "Least squares, geometry, inference, and the role of regularization.", takeaway: "Start here when a stable, additive relationship and interpretable coefficients are useful.", caution: "A linear association is not a causal effect." },
  { slug: "logistic-regression", title: "Logistic regression", family: "Linear methods", task: "Classification", summary: "From log-odds to likelihood, convex optimization, and probability estimates.", takeaway: "A strong starting point for binary outcomes and sparse, high-dimensional features.", caution: "Linear log-odds do not imply a linear probability response." },
  { slug: "decision-tree", title: "Decision tree", family: "Tree methods", task: "Regression & classification", summary: "Recursive partitions, impurity reduction, leaf estimates, and pruning.", takeaway: "Use a small tree when explicit, nonlinear decision rules are the main requirement.", caution: "A readable rule can still be unstable or unsupported outside its training region." },
  { slug: "random-forest", title: "Random forest", family: "Tree methods", task: "Regression & classification", summary: "Bootstrap aggregation, feature randomness, correlation, and variance reduction.", takeaway: "A useful nonlinear tabular baseline when you want interactions with modest tuning.", caution: "Averaging reduces variance; it does not remove shared bias." },
  { slug: "xgboost", title: "Boosting & XGBoost", family: "Tree methods", task: "Regression & classification", summary: "Functional gradients, second-order tree objectives, shrinkage, and split gains.", takeaway: "Consider boosting for structured tabular problems where flexible interactions matter.", caution: "More boosting rounds can keep fitting noise after useful structure is learned." },
] as const;
export type AlgorithmSlug = typeof algorithms[number]["slug"];
export const tutorialPath = (slug: string) => `/tutorials/machine-learning/${slug}`;

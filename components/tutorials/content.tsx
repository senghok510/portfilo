import katex from "katex";
import "katex/dist/katex.min.css";

export function Equation({ math, label }: { math: string; label?: string }) {
  return <figure className="tutorial-equation"><div tabIndex={0} role="region" aria-label={label ?? "Mathematical equation"} dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { displayMode: true, throwOnError: true, output: "htmlAndMathml", strict: "error" }) }} />{label && <figcaption>{label}</figcaption>}</figure>;
}
export function Symbols({ rows }: { rows: string[][] }) {
  return <div className="tutorial-table"><table><caption>Notation used in this article</caption><thead><tr><th scope="col">Symbol</th><th scope="col">Meaning</th></tr></thead><tbody>{rows.map(([symbol, meaning]) => <tr key={symbol}><th scope="row" dangerouslySetInnerHTML={{ __html: katex.renderToString(symbol, { throwOnError: true }) }} /><td>{meaning}</td></tr>)}</tbody></table></div>;
}
export function ReferenceTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="tutorial-table" tabIndex={0} role="region" aria-label={headers.join(", ")}><table><thead><tr>{headers.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
export function Insight({ title, children }: { title: string; children: React.ReactNode }) {
  return <aside className="tutorial-insight"><strong>{title}</strong><div>{children}</div></aside>;
}

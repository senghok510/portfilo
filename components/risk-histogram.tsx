// Static histogram of risk scores, colored by risk band (status palette).
const BANDS = [
  { name: "LOW", color: "#0ca30c", bins: [0, 1, 2] },
  { name: "MEDIUM", color: "#fab219", bins: [3, 4, 5] },
  { name: "HIGH", color: "#ec835a", bins: [6, 7, 8] },
  { name: "CRITICAL", color: "#d03b3b", bins: [9, 10] },
];

const BIN_LABELS = ["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100+"];

export function RiskHistogram({
  counts,
  ariaLabel,
}: {
  counts: number[]; // one count per 10-point score bin: 0–9 … 90–99, ≥100
  ariaLabel: string;
}) {
  const width = 640;
  const height = 280;
  const margin = { top: 34, right: 8, bottom: 26, left: 42 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const binW = plotW / counts.length;
  const barW = binW - 2;
  const radius = 4;

  const maxY = 1800;
  const ticks = [0, 600, 1200, 1800];
  const y = (v: number) => margin.top + plotH * (1 - v / maxY);

  const roundedBar = (x: number, count: number) => {
    const top = y(count);
    const bottom = margin.top + plotH;
    const r = Math.min(radius, (bottom - top) / 2);
    return [
      `M ${x} ${bottom}`,
      `L ${x} ${top + r}`,
      `Q ${x} ${top} ${x + r} ${top}`,
      `L ${x + barW - r} ${top}`,
      `Q ${x + barW} ${top} ${x + barW} ${top + r}`,
      `L ${x + barW} ${bottom}`,
      "Z",
    ].join(" ");
  };

  const bandOf = (bin: number) => BANDS.find((b) => b.bins.includes(bin))!;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="w-full"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke={tick === 0 ? "#d6d3d1" : "#f0efee"}
              strokeWidth={1}
            />
            <text
              x={margin.left - 6}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill="#a8a29e"
            >
              {tick.toLocaleString("en-US")}
            </text>
          </g>
        ))}
        {BANDS.map((band) => {
          const start = margin.left + band.bins[0] * binW;
          const end = margin.left + (band.bins[band.bins.length - 1] + 1) * binW;
          const total = band.bins.reduce((sum, bin) => sum + counts[bin], 0);
          return (
            <g key={band.name}>
              <circle cx={(start + end) / 2 - 4 - band.name.length * 3.2} cy={10} r={3.5} fill={band.color} />
              <text
                x={(start + end) / 2 + 4}
                y={10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fontWeight={600}
                letterSpacing={0.5}
                fill="#57534e"
              >
                {band.name}
              </text>
              <text
                x={(start + end) / 2}
                y={24}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill="#a8a29e"
              >
                {total.toLocaleString("en-US")}
              </text>
            </g>
          );
        })}
        {counts.map((count, bin) => {
          const x = margin.left + bin * binW + 1;
          const band = bandOf(bin);
          return (
            <path key={bin} d={roundedBar(x, count)} fill={band.color}>
              <title>{`Score ${BIN_LABELS[bin]}${bin < 10 ? `–${Number(BIN_LABELS[bin]) + 9}` : ""} (${band.name}): ${count.toLocaleString("en-US")} emails`}</title>
            </path>
          );
        })}
        {BIN_LABELS.map((label, bin) => (
          <text
            key={label}
            x={margin.left + bin * binW + binW / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize={10.5}
            fill="#78716c"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

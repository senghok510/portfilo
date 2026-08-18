// Static grouped bar chart for two-series score comparisons (0–1 scale).
const SERIES_COLORS = ["#2a78d6", "#eb6834"];

type Group = {
  label: string;
  values: [number, number];
};

export function GroupedBarChart({
  series,
  groups,
  ariaLabel,
}: {
  series: [string, string];
  groups: Group[];
  ariaLabel: string;
}) {
  const width = 640;
  const height = 250;
  const margin = { top: 16, right: 8, bottom: 26, left: 34 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const groupW = plotW / groups.length;
  const barW = 36;
  const barGap = 2;
  const radius = 4;

  const y = (v: number) => margin.top + plotH * (1 - v);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const roundedBar = (x: number, v: number) => {
    const top = y(v);
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

  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
        {series.map((name, i) => (
          <span key={name} className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-sm"
              style={{ backgroundColor: SERIES_COLORS[i] }}
            />
            {name}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="mt-3 w-full"
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
              {tick === 0 || tick === 1 ? tick.toFixed(0) : tick.toFixed(2)}
            </text>
          </g>
        ))}
        {groups.map((group, gi) => {
          const groupX = margin.left + groupW * gi;
          const pairW = barW * 2 + barGap;
          const startX = groupX + (groupW - pairW) / 2;
          return (
            <g key={group.label}>
              {group.values.map((value, si) => {
                const x = startX + si * (barW + barGap);
                return (
                  <g key={si}>
                    <path d={roundedBar(x, value)} fill={SERIES_COLORS[si]}>
                      <title>{`${series[si]} — ${group.label}: ${value}`}</title>
                    </path>
                    <text
                      x={x + barW / 2}
                      y={y(value) - 5}
                      textAnchor="middle"
                      fontSize={10.5}
                      fontWeight={500}
                      fill="#57534e"
                    >
                      {value.toFixed(3)}
                    </text>
                  </g>
                );
              })}
              <text
                x={groupX + groupW / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize={11.5}
                fill="#57534e"
              >
                {group.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

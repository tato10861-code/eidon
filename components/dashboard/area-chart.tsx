export function AreaChart({
  data,
  labels,
  height = 220,
}: {
  data: number[];
  labels: string[];
  height?: number;
}) {
  const width = 640;
  const paddingX = 10;
  const paddingTop = 14;
  const paddingBottom = 26;
  const max = Math.max(...data) * 1.08;

  const points = data.map((value, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / (data.length - 1);
    const y = height - paddingBottom - (value / max) * (height - paddingTop - paddingBottom);
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${height - paddingBottom} L${points[0][0].toFixed(1)},${height - paddingBottom} Z`;

  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Conversation volume over the last 14 days"
    >
      <defs>
        <linearGradient id="eidon-usage" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cbff5a" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#cbff5a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((ratio) => {
        const y = paddingTop + ratio * (height - paddingTop - paddingBottom);
        return (
          <line
            key={ratio}
            x1={paddingX}
            x2={width - paddingX}
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 5"
          />
        );
      })}

      <path d={area} fill="url(#eidon-usage)" />
      <path
        d={line}
        fill="none"
        stroke="#cbff5a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="3.5"
        fill="#cbff5a"
      />

      {labels.map((label, index) => {
        if (index % 2 !== 0 && index !== labels.length - 1) return null;
        return (
          <text
            key={`${label}-${index}`}
            x={points[index][0]}
            y={height - 8}
            textAnchor="middle"
            fontSize="9"
            fill="rgba(152,162,179,0.55)"
            fontFamily="var(--font-mono)"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

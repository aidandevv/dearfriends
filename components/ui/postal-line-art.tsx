type PostalLineArtVariant = 'full' | 'dashboard' | 'panel' | 'compact'

const strokeProps = {
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  vectorEffect: 'nonScalingStroke' as const,
}

function svgNumber(value: number): string {
  return value.toFixed(3)
}

function WagonWheel({ cx, cy, r, opacity = 1 }: { cx: number; cy: number; r: number; opacity?: number }) {
  const spokes = 20

  return (
    <g opacity={opacity} transform={`translate(${cx} ${cy})`}>
      <circle r={svgNumber(r * 0.06)} fill="var(--periwinkle)" />
      {Array.from({ length: spokes }, (_, i) => {
        const angle = (i * 360) / spokes
        const rad = (angle * Math.PI) / 180

        return (
          <line
            key={angle}
            x1={0}
            y1={0}
            x2={svgNumber(Math.cos(rad) * r * 0.92)}
            y2={svgNumber(Math.sin(rad) * r * 0.92)}
            stroke="var(--periwinkle)"
            strokeWidth={0.75}
            {...strokeProps}
          />
        )
      })}
      <circle r={r} fill="none" stroke="var(--periwinkle)" strokeWidth={1} {...strokeProps} />
    </g>
  )
}

function RouteNode({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={svgNumber(13 * scale)} fill="none" stroke="var(--periwinkle)" strokeWidth={1.35} {...strokeProps} />
      <circle cx={cx} cy={cy} r={svgNumber(8.6 * scale)} fill="var(--surface-raised)" />
      <circle cx={cx} cy={cy} r={svgNumber(6.2 * scale)} fill="var(--peach)" />
    </g>
  )
}

function FullRoute() {
  return (
    <>
      <path
        d="M-70 486 C 132 318 260 334 410 456 S 705 610 880 404 S 1140 216 1304 324"
        fill="none"
        stroke="var(--periwinkle)"
        strokeWidth={1.45}
        {...strokeProps}
      />
      <path
        d="M-92 548 C 74 458 244 488 392 578 S 686 686 866 540 S 1114 410 1294 490"
        fill="none"
        stroke="var(--peach)"
        strokeDasharray="3 8"
        strokeWidth={1.15}
        opacity={0.78}
        {...strokeProps}
      />
      <path
        d="M110 120 C 284 42 448 88 616 176 S 926 286 1128 140"
        fill="none"
        stroke="var(--periwinkle)"
        strokeDasharray="8 10"
        strokeWidth={1.15}
        opacity={0.72}
        {...strokeProps}
      />
      <line x1="296" y1="382" x2="296" y2="104" stroke="var(--peach)" strokeDasharray="3 8" strokeWidth={1.15} {...strokeProps} />
      <line x1="682" y1="568" x2="682" y2="722" stroke="var(--peach)" strokeDasharray="3 8" strokeWidth={1.15} {...strokeProps} />
      <line x1="1010" y1="300" x2="1010" y2="78" stroke="var(--peach)" strokeDasharray="3 8" strokeWidth={1.15} {...strokeProps} />
      <RouteNode cx={296} cy={382} />
      <RouteNode cx={682} cy={568} />
      <RouteNode cx={1010} cy={300} />
      <WagonWheel cx={86} cy={128} r={43} opacity={0.76} />
      <WagonWheel cx={1140} cy={616} r={38} opacity={0.58} />
      <WagonWheel cx={1078} cy={106} r={31} opacity={0.5} />
    </>
  )
}

function PanelRoute() {
  return (
    <>
      <path
        d="M-46 240 C 120 110 252 132 380 246 S 650 390 828 214"
        fill="none"
        stroke="var(--periwinkle)"
        strokeWidth={1.35}
        {...strokeProps}
      />
      <path
        d="M-70 302 C 94 212 232 232 368 326 S 640 442 850 304"
        fill="none"
        stroke="var(--peach)"
        strokeDasharray="3 8"
        strokeWidth={1.05}
        opacity={0.75}
        {...strokeProps}
      />
      <RouteNode cx={218} cy={169} scale={0.85} />
      <RouteNode cx={520} cy={332} scale={0.85} />
      <WagonWheel cx={82} cy={70} r={30} opacity={0.55} />
      <WagonWheel cx={742} cy={420} r={34} opacity={0.48} />
    </>
  )
}

function CompactRoute() {
  return (
    <>
      <path
        d="M-36 150 C 78 56 188 72 290 150 S 474 252 620 120"
        fill="none"
        stroke="var(--periwinkle)"
        strokeWidth={1.3}
        {...strokeProps}
      />
      <path
        d="M42 238 C 184 174 310 198 424 266 S 612 324 732 248"
        fill="none"
        stroke="var(--peach)"
        strokeDasharray="3 8"
        strokeWidth={1.05}
        opacity={0.78}
        {...strokeProps}
      />
      <RouteNode cx={194} cy={87} scale={0.72} />
      <RouteNode cx={442} cy={198} scale={0.72} />
      <WagonWheel cx={72} cy={270} r={24} opacity={0.55} />
    </>
  )
}

export function PostalLineArt({
  className,
  variant = 'full',
}: {
  className?: string
  variant?: PostalLineArtVariant
}) {
  const viewBox = variant === 'compact' ? '0 0 720 330' : variant === 'panel' ? '0 0 840 480' : '0 0 1200 760'

  return (
    <svg
      aria-hidden
      className={className}
      viewBox={viewBox}
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="geometricPrecision"
    >
      {variant === 'compact' ? <CompactRoute /> : variant === 'panel' ? <PanelRoute /> : <FullRoute />}
      {variant === 'dashboard' && (
        <>
          <path
            d="M80 710 C 270 612 436 638 596 706 S 900 824 1110 644"
            fill="none"
            stroke="var(--periwinkle)"
            strokeDasharray="7 10"
            strokeWidth={1.05}
            opacity={0.46}
            {...strokeProps}
          />
          <WagonWheel cx={132} cy={664} r={28} opacity={0.35} />
        </>
      )}
    </svg>
  )
}

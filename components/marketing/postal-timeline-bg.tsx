const strokeProps = {
  strokeLinecap: 'round' as const,
  vectorEffect: 'nonScalingStroke' as const,
}

function WagonWheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const spokes = 22
  const spokeInset = r * 0.96

  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle className="fill-periwinkle" r={r * 0.05} />
      {Array.from({ length: spokes }, (_, i) => {
        const angle = (i * 360) / spokes
        const rad = (angle * Math.PI) / 180

        return (
          <line
            key={angle}
            x1={0}
            y1={0}
            x2={Math.cos(rad) * spokeInset}
            y2={Math.sin(rad) * spokeInset}
            className="stroke-periwinkle"
            strokeWidth={0.7}
            {...strokeProps}
          />
        )
      })}
      <circle
        r={r}
        className="stroke-periwinkle"
        fill="none"
        strokeWidth={0.85}
        {...strokeProps}
      />
    </g>
  )
}

function TimelineNode({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={13}
        className="stroke-periwinkle"
        fill="none"
        strokeWidth={1.4}
        {...strokeProps}
      />
      <circle cx={cx} cy={cy} r={8.5} fill="white" />
      <circle cx={cx} cy={cy} r={6.5} className="fill-peach" />
    </g>
  )
}

function horizontalSineY(
  x: number,
  midY: number,
  amplitude: number,
  period: number,
  phaseX: number,
) {
  return midY - amplitude * Math.cos((2 * Math.PI * (x - phaseX)) / period)
}

function verticalSineX(
  y: number,
  midX: number,
  amplitude: number,
  period: number,
  phaseY: number,
) {
  return midX + amplitude * Math.cos((2 * Math.PI * (y - phaseY)) / period)
}

function horizontalSinePath(
  xStart: number,
  xEnd: number,
  midY: number,
  amplitude: number,
  period: number,
  phaseX: number,
  steps = 96,
) {
  let d = ''
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const x = xStart + (xEnd - xStart) * t
    const y = horizontalSineY(x, midY, amplitude, period, phaseX)
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)} `
  }
  return d.trim()
}

function verticalSinePath(
  yStart: number,
  yEnd: number,
  midX: number,
  amplitude: number,
  period: number,
  phaseY: number,
  steps = 96,
) {
  let d = ''
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const y = yStart + (yEnd - yStart) * t
    const x = verticalSineX(y, midX, amplitude, period, phaseY)
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)} `
  }
  return d.trim()
}

export function PostalTimelineDesktopBg({ className }: { className?: string }) {
  const xStart = 118
  const xEnd = 1545
  const midY = 390
  const amplitude = 192
  const period = 1065
  const phaseX = 299

  const nodes = [
    { x: phaseX, y: horizontalSineY(phaseX, midY, amplitude, period, phaseX) },
    { x: phaseX + period / 2, y: horizontalSineY(phaseX + period / 2, midY, amplitude, period, phaseX) },
    { x: phaseX + period, y: horizontalSineY(phaseX + period, midY, amplitude, period, phaseX) },
  ] as const

  const startY = horizontalSineY(xStart, midY, amplitude, period, phaseX)
  const endY = horizontalSineY(xEnd, midY, amplitude, period, phaseX)
  const wavePath = horizontalSinePath(xStart, xEnd, midY, amplitude, period, phaseX)

  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 1663 946"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="geometricPrecision"
    >
      <WagonWheel cx={108} cy={108} r={46} />
      <WagonWheel cx={198} cy={792} r={40} />
      <WagonWheel cx={1458} cy={98} r={44} />
      <WagonWheel cx={1510} cy={812} r={38} />

      <path
        d={`M 0 ${startY.toFixed(2)} H ${xStart}`}
        className="stroke-periwinkle"
        strokeWidth={1.5}
        strokeDasharray="7 9"
        {...strokeProps}
      />
      <path
        d={wavePath}
        className="stroke-periwinkle"
        strokeWidth={1.5}
        {...strokeProps}
      />
      <path
        d={`M ${xEnd} ${endY.toFixed(2)} H 1663`}
        className="stroke-periwinkle"
        strokeWidth={1.5}
        strokeDasharray="7 9"
        {...strokeProps}
      />

      {nodes.map((node, i) => (
        <line
          key={`guide-${node.x}`}
          x1={node.x}
          y1={node.y}
          x2={node.x}
          y2={i === 1 ? 868 : 52}
          className="stroke-peach"
          strokeWidth={1.5}
          strokeDasharray="2.5 7"
          {...strokeProps}
        />
      ))}

      {nodes.map(node => (
        <TimelineNode key={`node-${node.x}`} cx={node.x} cy={node.y} />
      ))}
    </svg>
  )
}

export function PostalTimelineMobileBg({ className }: { className?: string }) {
  const yStart = 118
  const yEnd = 1599
  const midX = 458
  const amplitude = 60
  const period = 1192
  const phaseY = 262

  const nodes = [
    { cx: verticalSineX(phaseY, midX, amplitude, period, phaseY), cy: phaseY, dir: 'right' as const },
    {
      cx: verticalSineX(phaseY + period / 2, midX, amplitude, period, phaseY),
      cy: phaseY + period / 2,
      dir: 'left' as const,
    },
    {
      cx: verticalSineX(phaseY + period, midX, amplitude, period, phaseY),
      cy: phaseY + period,
      dir: 'right' as const,
    },
  ] as const

  const startX = verticalSineX(yStart, midX, amplitude, period, phaseY)
  const endX = verticalSineX(yEnd, midX, amplitude, period, phaseY)
  const wavePath = verticalSinePath(yStart, yEnd, midX, amplitude, period, phaseY)

  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 916 1717"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="geometricPrecision"
    >
      <WagonWheel cx={148} cy={198} r={42} />
      <WagonWheel cx={768} cy={718} r={40} />
      <WagonWheel cx={172} cy={1418} r={38} />

      <path
        d={`M ${startX.toFixed(2)} 0 V ${yStart}`}
        className="stroke-periwinkle"
        strokeWidth={1.5}
        strokeDasharray="7 9"
        {...strokeProps}
      />
      <path
        d={wavePath}
        className="stroke-periwinkle"
        strokeWidth={1.5}
        {...strokeProps}
      />
      <path
        d={`M ${endX.toFixed(2)} ${yEnd} V 1717`}
        className="stroke-periwinkle"
        strokeWidth={1.5}
        strokeDasharray="7 9"
        {...strokeProps}
      />

      {nodes.map(node => (
        <line
          key={`guide-${node.cy}`}
          x1={node.cx}
          y1={node.cy}
          x2={node.dir === 'right' ? 868 : 48}
          y2={node.cy}
          className="stroke-periwinkle"
          strokeWidth={1.5}
          strokeDasharray="2.5 7"
          {...strokeProps}
        />
      ))}

      {nodes.map(node => (
        <TimelineNode key={`node-${node.cy}`} cx={node.cx} cy={node.cy} />
      ))}
    </svg>
  )
}

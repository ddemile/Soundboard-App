interface SectionData {
    icon: string
}

export default function OverlayWheel({
    data,
    radius,
    activeSection,
    activeMultiplier = 1.2,
    middleCircleMultiplier = 0.15,
    middleCircleHovered = false
}: {
    data: SectionData[];
    radius: number;
    activeSection: number | null;
    activeMultiplier?: number;
    middleCircleMultiplier?: number;
    middleCircleHovered?: boolean
}) {
    const sections = data.length;

    const center = radius * activeMultiplier; // Center x and y

    const elements = Array.from({ length: sections }).map((_, i) => {
        const startAngle = (i * 2 * Math.PI) / sections;
        const endAngle = ((i + 1) * 2 * Math.PI) / sections;
        const midAngle = (startAngle + endAngle) / 2;
        const sectionAngle = endAngle - startAngle;

        const sectionRadius = activeSection === i ? radius * activeMultiplier : radius;

        // Calculate points on the circumference
        const x1 = center + sectionRadius * Math.cos(startAngle);
        const y1 = center + sectionRadius * Math.sin(startAngle);
        const x2 = center + sectionRadius * Math.cos(endAngle);
        const y2 = center + sectionRadius * Math.sin(endAngle);

        // Midpoint for emoji placement
        const emojiX = center + (sectionRadius * 0.6) * Math.cos(midAngle);
        const emojiY = center + (sectionRadius * 0.6) * Math.sin(midAngle);

        // Large-arc flag (0 or 1), for angles > 180° it should be 1
        const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

        // Calculate font size from arc length (limit to radius/2)
        const arcLength = sectionRadius * sectionAngle;
        const fontSize = Math.min(arcLength * 0.4, radius / 2);

        const middleCrossSize = radius * middleCircleMultiplier
        const middleCircleRadius = middleCrossSize * (middleCircleHovered ? activeMultiplier : 1)

        return (
            <g key={i} className=" hover:cursor-pointer">
                <path
                    d={`M${center},${center} L${x1},${y1} A${sectionRadius},${sectionRadius} 0 ${largeArcFlag},1 ${x2},${y2} Z`}
                    fill={activeSection === i ? "#2B2B2B" : "#222222"} // Different color for each section
                    className="transition-all"
                />
                <line
                    x1={center}
                    y1={center}
                    x2={center + radius * Math.cos(startAngle)}
                    y2={center + radius * Math.sin(startAngle)}
                    stroke="#1c1c1c"
                    strokeWidth={2}
                />
                <g
                    className="transition-all"
                    style={{
                        transform: `translate(${emojiX}px, ${emojiY}px)`,
                    }}
                >
                    <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={fontSize} // Adjust size relative to radius
                    >
                        {data[i].icon}
                    </text>
                </g>
                <circle className="transition-all" style={{ opacity: middleCircleHovered ? 0.96 : 1 }} r={middleCircleRadius} fill={middleCircleHovered ? "#2B2B2B" : "#222222"} cx={center} cy={center} stroke="#1c1c1c" strokeWidth={2} />
                <svg className="transition-all origin-center" style={{ scale: middleCircleHovered ? activeMultiplier : 1 }} width={middleCircleRadius} height={middleCrossSize} x={center - middleCrossSize / 2} y={center - middleCrossSize / 2}>
                    <line className="stroke-neutral-500" x1="0" y1="0" x2={middleCrossSize} y2={middleCrossSize} strokeWidth="2" />
                    <line className="stroke-neutral-500" x1={middleCrossSize} y1="0" x2="0" y2={middleCrossSize} strokeWidth="2" />
                </svg>
            </g>
        );
    });

    return <svg className="select-none" width={center * 2} height={center * 2}>{elements}</svg>;
}
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import * as bsIcons from "react-icons/bs";
import { Card, CardContent, CardHeader } from "./ui/card.tsx";
import { Input } from "./ui/input.tsx";

export default function IconSelector({ onIconClick }: { onIconClick?: ({ name }: { name: string }) => void }) {
    const rowSize = useRef(8)
    const [value, setValue] = useState("")
    const [icons] = useState(Object.entries(bsIcons))
    const filteredIcons = useMemo(() => icons.filter(([name]) => {
        if (value === '') return true;

        return name.toLowerCase().includes(value.toLowerCase())
    }), [value])

    const parentRef = useRef(null)

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;

        setValue(value)
    }

    const rowVirtualizer = useVirtualizer({
        count: Math.ceil(filteredIcons.length / rowSize.current),
        getScrollElement: () => parentRef.current,
        estimateSize: () => 35,
    })

    return (
        <Card className="bg-stone-950/90">
            <CardHeader className="p-4 pb-0">
                <Input value={value} onChange={handleChange} placeholder="Search an icon"></Input>
            </CardHeader>
            <CardContent className="p-4">
                <div
                    ref={parentRef}
                    style={{
                    height: `300px`,
                    width: '350px',
                    overflow: 'auto', // Make it scroll!
                    }}
                >
                    {/* The large inner element to hold all of the items */}
                    <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                    >
                    {/* Only the visible items in the virtualizer, manually positioned to be in view */}
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const icons = filteredIcons.slice(virtualItem.index * rowSize.current, virtualItem.index * rowSize.current + rowSize.current)

                        while (icons.length < rowSize.current) {
                            icons.push([null, null] as any)
                        }

                        return (
                            <div
                                key={virtualItem.key}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px)`
                                }}
                                className="flex"
                                >
                                {icons.map(([name, Icon]) => (
                                    name ? (
                                        <div key={name} onClick={() => onIconClick?.({ name })} className="w-full m-0.5">
                                        <Icon className="hover:cursor-pointer" size={"auto"} />
                                        </div>
                                    ) : (
                                        <div key={name} className="w-full m-0.5">
                                            <span className="w-auto" />
                                        </div>
                                    )
                                ))}
                            </div>
                        )
                    })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    // return (
    //     <div className="border-[1px] border-zinc-300 dark:border-zinc-800 rounded flex w-96 h-auto min-h-[322px] overflow-hidden flex-col bg-neutral-200 dark:bg-zinc-900">
    //         <input placeholder="Type something..." className="rounded p-0.5 m-1 outline-hidden" value={value} onChange={handleChange}></input>
    //         <AutoSizer>
    //             {({ width, height }) => {
    //                 const rowCount = 12

    //                 return <Grid autoContainerWidth className="list-none" columnWidth={32} columnCount={rowCount} rowCount={Math.ceil(filteredIcons.length / rowCount)} width={width} height={height} rowHeight={32} cellRenderer={({ columnIndex, rowIndex, style }) => {
    //                     const item = filteredIcons[columnIndex + rowIndex * rowCount]

    //                     if (!item || !item[1]) return <div> </div>

    //                     const Icon = item[1]

    //                     return <li title={item[0]} style={style} className="p-1 cursor-pointer" key={item[0]} onClick={() => onIconClick?.({ name: item[0] })}>
    //                         <Icon size={"auto"} />
    //                     </li>
    //                 }}>
    //                 </Grid>
    //             }
    //             }
    //         </AutoSizer>
    //     </div>
    // )
}

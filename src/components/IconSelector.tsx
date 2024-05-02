import { ChangeEvent, useMemo, useState } from "react";
import * as bsIcons from "react-icons/bs";
import { AutoSizer } from "react-virtualized/dist/es/AutoSizer";
import { Grid } from "react-virtualized/dist/es/Grid";

export default function IconSelector({ onIconClick }: { onIconClick?: ({ name }: { name: string }) => void }) {
    const [value, setValue] = useState("")
    const [icons] = useState(Object.entries(bsIcons))
    const filteredIcons = useMemo(() => icons.filter(([name]) => {
        if (value === '') return true;

        return name.toLowerCase().includes(value.toLowerCase())
    }), [value])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;

        setValue(value)
    }

    return (
        <div className="border-[1px] border-zinc-300 dark:border-zinc-800 rounded flex w-96 h-auto min-h-[322px] overflow-hidden flex-col bg-neutral-200 dark:bg-[#303031]">
            <input placeholder="Type something..." className="rounded p-0.5 m-1 outline-none" value={value} onChange={handleChange}></input>
            <AutoSizer>
                {({ width, height }) => {
                    const rowCount = 12

                    return <Grid autoContainerWidth className="list-none" columnWidth={32} columnCount={rowCount} rowCount={Math.ceil(filteredIcons.length / rowCount)} width={width} height={height} rowHeight={32} cellRenderer={({ columnIndex, rowIndex, style }) => {
                        const item = filteredIcons[columnIndex + rowIndex * rowCount]

                        if (!item || !item[1]) return <div> </div>

                        const Icon = item[1]

                        return <li title={item[0]} style={style} className="p-1 cursor-pointer" key={item[0]} onClick={() => onIconClick?.({ name: item[0] })}>
                            <Icon size={"auto"} />
                        </li>
                    }}>
                    </Grid>
                }
                }
            </AutoSizer>
        </div>
    )
}

import { ChangeEvent, useState } from "react";
import * as bsIcons from "react-icons/bs";
import { AutoSizer } from "react-virtualized/dist/es/AutoSizer";
import { Grid } from "react-virtualized/dist/es/Grid";

export default function IconSelector({ onIconClick }: { onIconClick?: ({ name }: { name: string }) => void }) {
    const [value, setValue] = useState("")
    const [icons] = useState(Object.entries(bsIcons))
    const [filteredIcons, setFilteredIcons] = useState(icons)

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;

        setValue(value)

        setFilteredIcons(() => icons.filter(([name, Icon]) => {
            //if no input the return the original
            if (value === '') {
                return [name, Icon];
            }
            //return the item which contains the user input
            else {
                return name.toLowerCase().includes(value.toLowerCase())
            }
        }))
    }

    return (
        <div className="border-[1px] border-zinc-800 rounded flex w-96 h-auto min-h-[322px] overflow-hidden flex-col bg-[#303031]">
            <input className="rounded p-0.5 m-1" value={value} onChange={handleChange}></input>
            <AutoSizer>
                {({ width, height }) => {
                    const rowCount = 12


                    return <Grid autoContainerWidth className="list-none" columnWidth={32} columnCount={rowCount} rowCount={Math.ceil(filteredIcons.length / rowCount)} width={width} height={height} rowHeight={32} cellRenderer={({ columnIndex, rowIndex, style }) => {
                        const item = filteredIcons[columnIndex + rowIndex * rowCount]

                        if (!item || !item[1]) return <div> </div>

                        const Icon = item[1]

                        return <li style={style} className="p-1 cursor-pointer" key={item[0]} onClick={() => onIconClick?.({ name: item[0] })}>
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

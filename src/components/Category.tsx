import { IoVolumeMedium } from "react-icons/io5"
import { CategoryData, SoundEntry } from "../pages/Home.tsx"
import { BsPlayFill, BsSoundwave, BsStar, BsStarFill } from "react-icons/bs"
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowRight } from "react-icons/md"
import { MouseEvent, useContext } from "react"
import * as icons from "react-icons/bs"
import AppContext from "../contexts/AppContext.tsx"
import { useContextMenu } from "react-contexify"
import { SOUND_CONTEXT_MENU } from "./contextMenus/SoundContextMenu.tsx"
import useCategories from "../hooks/useCategories.ts"
import useModal from "../hooks/useModal.ts"
import { IconType } from "react-icons"
import { CATEGORY_CONTEXT_MENU } from "./contextMenus/CategoryContextMenu.tsx"

export default function Category(props: CategoryData & { onExpandToggle: (e: MouseEvent<HTMLButtonElement>, name: string) => void }) {
    const { name, expanded, sounds, icon, onExpandToggle } = props;
    const { play } = useContext(AppContext)!
    const { show } = useContextMenu()
    const { removeSound, addSound, save } = useCategories()
    const { open } = useModal("upload")

    const Icon: IconType = typeof icon == "function" ? icon : typeof icon == "string" && icon in icons ? icons[icon] : BsSoundwave

    const handleFavorite = (sound: SoundEntry) => {
        const categoryName = name == "Favorite" ? "Default" : "Favorite"

        removeSound(sound.name, name)
        addSound(sound, categoryName)
        save()
    }

    return (
        <div>
            <span onContextMenu={(e) => { e.stopPropagation(); show({ id: CATEGORY_CONTEXT_MENU, props, event: e })}} className='ml-2.5 text-left flex items-center gap-1 font-semibold'><Icon /> {name} <button onClick={(e) => onExpandToggle(e, name)} className='bg-transparent p-0 border-none outline-none focus:outline-none'>{expanded ? <MdOutlineKeyboardArrowDown /> : <MdOutlineKeyboardArrowRight />}</button></span>
            {expanded && <ul className='mb-2 grid mx-2.5 mt-1 gap-2.5 grid-cols-auto list-none'>
                {sounds.map((sound: SoundEntry) =>
                    <li key={sound.file} className='[&>*]:col-start-1 [&>*]:row-start-1 grid rounded-lg overflow-hidden group h-10' onContextMenu={(e) => { e.stopPropagation(); show({ id: SOUND_CONTEXT_MENU, event: e, props: { sound, category: { name, expanded, sounds } } })}}>
                        <div className='bg-main flex gap-1 items-center p-1 rounded-lg justify-center '>
                            <span className='text-xl'>{sound.emoji ?? "🎵"}</span>
                            <span className='font-medium overflow-x-hidden overflow-ellipsis text-xs'>{sound.name}</span>
                        </div>
                        <div className='bg-opacity-0 opacity-0 group-hover:bg-opacity-50 group-hover:opacity-100 bg-black w-full flex items-center justify-between px-1 transition-opacity'>
                            <button className='border-none outline-none focus:outline-none bg-transparent rounded-full aspect-square p-0 [&>*]:text-xl' onClick={() => play(sound)}>
                                <IoVolumeMedium />
                            </button>
                            <button className='border-none outline-none focus:outline-none bg-transparent rounded-full aspect-square p-0 [&>*]:text-3xl' onClick={() => play(sound)}>
                                <BsPlayFill />
                            </button>
                            <button className='border-none outline-none focus:outline-none bg-transparent rounded-full aspect-square p-0 [&>*]:text-md' onClick={() => handleFavorite(sound)}>
                                {name == "Favorite" ? <BsStarFill /> : <BsStar />}
                            </button>
                        </div>
                    </li>
                )}
                <li className='bg-main max-w-[200px] flex gap-1 items-center p-1 rounded-lg h-10 justify-center'>
                    <button className='bg-stone-900 rounded-full aspect-square p-1 border-none outline-none focus:outline-none' onClick={(e) => {
                        e.preventDefault()
                        open({ category: name })
                    }}><icons.BsPlus /></button>

                </li>
            </ul>


            }
        </div>
    )
}

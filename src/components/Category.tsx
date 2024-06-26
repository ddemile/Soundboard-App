import { MouseEvent, useContext } from "react"
import { useContextMenu } from "react-contexify"
import { IconType } from "react-icons"
import * as icons from "react-icons/bs"
import { BsPlayFill, BsSoundwave, BsStar, BsStarFill } from "react-icons/bs"
import { IoVolumeMedium } from "react-icons/io5"
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowRight } from "react-icons/md"
import AppContext from "../contexts/AppContext.tsx"
import useAudioPlayer from "../hooks/useAudioPlayer.ts"
import useCategories from "../hooks/useCategories.ts"
import useConfig from '../hooks/useConfig.ts'
import useModal from "../hooks/useModal.ts"
import { CategoryData, SoundEntry } from "../pages/Home.tsx"
import { BASE_API_URL } from '../utils/constants.ts'
import { CATEGORY_CONTEXT_MENU } from "./contextMenus/CategoryContextMenu.tsx"
import { SOUND_CONTEXT_MENU } from "./contextMenus/SoundContextMenu.tsx"

export default function Category({ onExpandToggle, ...props }: CategoryData & { onExpandToggle: (e: MouseEvent<HTMLButtonElement>, name: string) => void }) {
    const { name, expanded, sounds, icon } = props;
    const { play } = useContext(AppContext)!
    const { show } = useContextMenu()
    const { moveSound } = useCategories()
    const { config } = useConfig()
    const { open: openUploadModal } = useModal("upload")
    const { open: openInstantsModal } = useModal("my-instants")
    const player = useAudioPlayer()

    const Icon: IconType = typeof icon == "function" ? icon : typeof icon == "string" && icon in icons ? icons[icon] : BsSoundwave

    const handleFavorite = (sound: SoundEntry) => {
        const categoryName = name == "Favorite" ? "Default" : "Favorite"

        moveSound(sound.id, categoryName)
    }

    const handleSoundPreview = async (sound: SoundEntry) => {
        player.play({ id: `preview-${sound.id}`, url: `${BASE_API_URL}/sounds/${sound.id}`, volume: config.audio.previewVolume })
    }

    return (
        <div>
            <span onContextMenu={(e) => { e.stopPropagation(); show({ id: CATEGORY_CONTEXT_MENU, props, event: e }) }} className='ml-2.5 text-left flex items-center gap-1 font-semibold'><Icon /> {name} <button onClick={(e) => onExpandToggle(e, name)} className='bg-transparent p-0 border-none outline-none focus:outline-none'>{expanded ? <MdOutlineKeyboardArrowDown /> : <MdOutlineKeyboardArrowRight />}</button></span>
            {expanded && <ul className='mb-2 grid mx-2.5 mt-1 gap-2.5 grid-cols-150 list-none'>
                {sounds.map((sound: SoundEntry) =>
                    <li key={sound.id} className='[&>*]:col-start-1 [&>*]:row-start-1 grid rounded-lg overflow-hidden group h-10' onContextMenu={(e) => { e.stopPropagation(); show({ id: SOUND_CONTEXT_MENU, event: e, props: { sound, category: { name, expanded, sounds } } }) }}>
                        <div className='bg-neutral-100 dark:bg-main flex gap-1 items-center p-1 rounded-lg justify-center overflow-ellipsis overflow-hidden'>
                            <span className='text-xl'>{sound.emoji ?? "🎵"}</span>
                            <span className='font-medium line-clamp-2 break-words text-xs'>{sound.title}</span>
                        </div>
                        <div className='bg-opacity-0 opacity-0 group-hover:bg-opacity-25 dark:group-hover:bg-opacity-50 group-hover:opacity-100 bg-black w-full flex items-center justify-between px-1 transition-opacity'>
                            <button className='border-none outline-none focus:outline-none bg-transparent rounded-full aspect-square p-0 [&>*]:text-xl' onClick={() => handleSoundPreview(sound)}>
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
                <li className='bg-neutral-100 dark:bg-main max-w-[200px] flex gap-1 items-center p-1 rounded-lg h-10 justify-center'>
                    <button className='bg-neutral-300 dark:bg-stone-900 rounded-full aspect-square p-1 border-none outline-none focus:outline-none' onClick={(e) => {
                        e.preventDefault()

                        if (e.shiftKey) return openInstantsModal({ category: name })

                        openUploadModal({ category: name })
                    }}><icons.BsPlus /></button>
                </li>
            </ul>
            }
        </div>
    )
}

import { useEffect, useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { toast } from 'sonner';
import useCategories from '../../hooks/useCategories.ts';
import useConfig from '../../hooks/useConfig.ts';
import useLog from '../../hooks/useLog.ts';
import { SoundEntry } from '../Home.tsx';

const numpadKeys = [
    "INSERT",
    "END",
    "ARROWDOWN",
    "PAGEDOWN",
    "ARROWLEFT",
    "CLEAR",
    "ARROWRIGHT",
    "HOME",
    "ARROWUP",
    "PAGEUP",
]

export default function Keybinds() {
    const { categories, updateSound } = useCategories()
    const { updateConfig, config, saveConfig } = useConfig()
    const [selected, setSelected] = useState<{ id?: string | null, keys: string[] }>({ id: null, keys: [] })
    const log = useLog()

    const sounds = categories.reduce<SoundEntry[]>((accumulator, category) => [...accumulator, ...category.sounds], [])

    const findSoundCategory = (soundId: string) => {
        return categories.find(category => category.sounds.some(sound => sound.id == soundId))
    }

    useEffect(() => {
        const current = new Set<string>()
        const currentDisplayed = new Set<string>()

        setSelected({ ...selected, keys: [] })

        function onKeyPress(event: KeyboardEvent) {
            if (!current) return;

            const key = (event.key || event.code).toUpperCase();
            current.add(key);
            currentDisplayed.add(key);

            if (timeout) {
                clearTimeout(timeout)
                timeout = null;
            }

            setSelected({ ...selected, keys: Array.from(current).map(key => capitalize(key)) })
        }

        let timeout: NodeJS.Timeout | null = null;

        function onKeyRelease(event: KeyboardEvent) {
            if (!current) return;

            const key = (event.key || event.code).toUpperCase();
            const keys = structuredClone(currentDisplayed);

            if (keys.has("SHIFT") && numpadKeys.some(key => keys.has(key))) {
                keys.delete("SHIFT")
            }

            const keybind = Array.from(keys).map(key => capitalize(key)).join("+")

            if (!timeout) {
                timeout = setTimeout(() => {
                    if (current.size == 0 && selected.id) {
                        timeout = null;
                        setSelected({ ...selected, id: null })
                        if (sounds.map(sound => sound.keybind).includes(keybind)) return toast.error("A sound has already that keybind bind")
                        log(`Saved: ${keybind}`)
                        if (selected.id == "stop") {
                            updateConfig({ stopKeybind: keybind })
                            saveConfig()
                            return
                        }
                        updateSound(selected.id, findSoundCategory(selected.id)?.name!, { keybind })
                    }
                }, 200)
            }

            current.delete(key);

            setSelected({ ...selected, keys: Array.from(keys).map(key => capitalize(key)) })
        }

        function onClick() {
            setSelected({ ...selected, id: null })
        }

        // Add key event listeners
        document.addEventListener("keydown", onKeyPress);
        document.addEventListener("keyup", onKeyRelease);
        document.addEventListener("click", onClick)

        return () => {
            document.removeEventListener("keydown", onKeyPress)
            document.removeEventListener("keyup", onKeyRelease);
            document.removeEventListener("click", onClick)
        }
    }, [selected.id])


    return (
        <>
            <h1 className='text-3xl font-semibold text-left'>Shortcuts</h1>
            <ul className='w-full flex flex-col gap-3 max-w-3xl'>
                {sounds.map(sound => (
                    <li id={sound.id} key={sound.id} className='flex items-center gap-10'>
                        <div className='flex flex-col w-full text-left gap-1'>
                            <p className='text-left text-sm text-gray-500 dark:text-gray-300 font-semibold'>SOUND NAME</p>
                            <p className='w-full p-2 bg-neutral-200 dark:bg-stone-900 rounded-sm'>{sound.emoji || "🎵"} {sound.title}</p>
                        </div>
                        <div className='flex flex-col w-full text-left gap-1'>
                            <p className='text-left text-sm text-gray-500 dark:text-gray-300 font-semibold'>SHORTCUT</p>
                            <p onClick={(e) => { setSelected({ ...selected, id: sound.id }); e.stopPropagation() }} style={{ outline: selected.id == sound.id ? "2px solid rgb(239 68 68)" : "", boxShadow: selected.id == sound.id ? "0px 0px 5px 3px rgb(239 68 68)" : "" }} className="flex w-full whitespace-nowrap overflow-hidden text-ellipsis items-center gap-1 rounded-sm dark:bg-zinc-800 p-2 h-10 border-gray-200 border dark:border-none">{sound.id == selected.id ? selected.keys.join("+") : sound.keybind} <button onClick={(e) => { e.stopPropagation(); setSelected({ ...selected, id: null }); updateSound(sound.id, findSoundCategory(sound.id)?.name!, { keybind: "" }); saveConfig() }} className="ml-auto p-1 rounded-md"><AiOutlineClose /></button></p>
                        </div>
                    </li>
                ))}

                <div className='border-b-2 w-full border-white/20'></div>

                <li id={"stop-sound"} className='flex items-center gap-10'>
                    <div className='flex flex-col w-full text-left gap-1'>
                        <p className='text-left text-sm text-gray-500 dark:text-gray-300 font-semibold'>ACTION</p>
                        <p className='w-full p-2 bg-neutral-200 dark:bg-stone-900 rounded-sm'>Stop sound</p>
                    </div>
                    <div className='flex flex-col w-full text-left gap-1'>
                        <p className='text-left text-sm text-gray-500 dark:text-gray-300 font-semibold'>SHORTCUT</p>
                        <p onClick={(e) => { setSelected({ ...selected, id: "stop" }); e.stopPropagation() }} style={{ outline: selected.id == "stop" ? "2px solid rgb(239 68 68)" : "", boxShadow: selected.id == "stop" ? "0px 0px 5px 3px rgb(239 68 68)" : "" }} className="flex w-full whitespace-nowrap overflow-hidden text-ellipsis items-center gap-1 rounded-sm dark:bg-zinc-800 p-2 h-10 border-gray-200 border dark:border-none">{"stop" == selected.id ? selected.keys.join("+") : config?.stopKeybind} <button onClick={(e) => { e.stopPropagation(); setSelected({ ...selected, id: null }); updateConfig({ stopKeybind: "" }); saveConfig() }} className="ml-auto p-1 rounded-md"><AiOutlineClose /></button></p>
                    </div>
                </li>
            </ul>
        </>
    )

}

const capitalize = (word: string) => {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1)
};
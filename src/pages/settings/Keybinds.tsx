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
    const [selected, setSelected] = useState<{ file?: string | null, keys: string[] }>({ file: null, keys: [] })
    const log = useLog()

    const sounds = categories.reduce<SoundEntry[]>((accumulator, category) => [...accumulator, ...category.sounds], [])

    const findSoundCategory = (soundFile: string) => {
        return categories.find(category => category.sounds.some(sound => sound.file == soundFile))
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
                    if (current.size == 0 && selected.file) {
                        timeout = null;
                        setSelected({ ...selected, file: null })
                        if (sounds.map(sound => sound.keybind).includes(keybind)) return toast.error("A sound has already that keybind bind")
                        log(`Saved: ${keybind}`)
                        if (selected.file == "stop") {
                            updateConfig({ stopKeybind: keybind })
                            saveConfig()
                            return
                        }
                        updateSound(selected.file, findSoundCategory(selected.file)?.name!, { keybind })
                        saveConfig()
                    }
                }, 200)
            }

            current.delete(key);

            setSelected({ ...selected, keys: Array.from(keys).map(key => capitalize(key)) })
        }

        // Add key event listeners
        document.addEventListener("keydown", onKeyPress);
        document.addEventListener("keyup", onKeyRelease);

        return () => {
            document.removeEventListener("keydown", onKeyPress)
            document.removeEventListener("keyup", onKeyRelease);
        }
    }, [selected.file])


    return (
        <>
            <h1 className='text-3xl font-semibold text-left'>Shortcuts</h1>
            <ul className='w-full flex flex-col gap-3 max-w-3xl'>
                {sounds.map(sound => (
                    <li id={sound.file} key={sound.file} className='flex items-center gap-10'>
                        <div className='flex flex-col w-full text-left gap-1'>
                            <p className='text-left text-sm text-gray-300 font-semibold'>SOUND NAME</p>
                            <p className='w-full p-2 bg-stone-900 rounded-sm'>{sound.name}</p>
                        </div>
                        <div className='flex flex-col w-full text-left gap-1'>
                            <p className='text-left text-sm text-gray-300 font-semibold'>SHORTCUT</p>
                            <p onClick={() => setSelected({ ...selected, file: sound.file })} style={{ outline: selected.file == sound.file ? "2px solid rgb(239 68 68)" : "", boxShadow: selected.file == sound.file ? "0px 0px 5px 3px rgb(239 68 68)" : "" }} className="flex w-full whitespace-nowrap overflow-hidden text-ellipsis items-center gap-1 rounded-sm bg-zinc-800 p-2 h-10">{sound.file == selected.file ? selected.keys.join("+") : sound.keybind} <button onClick={(e) => { e.stopPropagation(); setSelected({ ...selected, file: null }); updateSound(sound.file, findSoundCategory(sound.file)?.name!, { keybind: "" }); saveConfig() }} className="ml-auto p-1 rounded-md"><AiOutlineClose /></button></p>
                        </div>
                    </li>
                ))}

                <div className='border-b-2 w-full border-opacity-20 border-white'></div>

                <li id={"stop-sound"} className='flex items-center gap-10'>
                    <div className='flex flex-col w-full text-left gap-1'>
                        <p className='text-left text-sm text-gray-300 font-semibold'>ACTION</p>
                        <p className='w-full p-2 bg-stone-900 rounded-sm'>Stop sound</p>
                    </div>
                    <div className='flex flex-col w-full text-left gap-1'>
                        <p className='text-left text-sm text-gray-300 font-semibold'>SHORTCUT</p>
                        <p onClick={() => setSelected({ ...selected, file: "stop" })} style={{ outline: selected.file == "stop" ? "2px solid rgb(239 68 68)" : "", boxShadow: selected.file == "stop" ? "0px 0px 5px 3px rgb(239 68 68)" : "" }} className="flex w-full whitespace-nowrap overflow-hidden text-ellipsis items-center gap-1 rounded-sm bg-zinc-800 p-2 h-10">{"stop" == selected.file ? selected.keys.join("+") : config?.stopKeybind} <button onClick={(e) => { e.stopPropagation(); setSelected({ ...selected, file: null }); updateConfig({ stopKeybind: "" }); saveConfig() }} className="ml-auto p-1 rounded-md"><AiOutlineClose /></button></p>
                    </div>
                </li>
            </ul>
        </>
    )

}

const capitalize = (word: string) => {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1)
};
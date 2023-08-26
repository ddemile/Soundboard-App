import { ChangeEvent, ElementRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { toast } from "react-toastify";
import useCategories from "../../hooks/useCategories.ts";
import useLog from "../../hooks/useLog.ts";
import useModal from "../../hooks/useModal.ts";
import Button from "./Button.tsx";
import Modal from "./Modal.tsx";

export default function ConfigModal() {
    const nameRef = useRef<ElementRef<"h3">>(null)
    const [recordingKeys, setRecordingKeys] = useState<boolean>(false)
    const [_savedKeys, setSavedKeys] = useState<string[]>([])
    const [_keys, setKeys] = useState<string[]>([])
    const { isOpen, setIsOpen, close, props: initialProps } = useModal("config")
    const [props, setProps] = useState(initialProps)
    const { updateSound, save } = useCategories()
    const log = useLog()

    useLayoutEffect(() => {
        setProps(initialProps)
    }, [initialProps])

    useEffect(() => {
        const current = new Set<string>()

        function onKeyPress(event: KeyboardEvent) {
            if (!current) return;

            const key = (event.key || event.code).toUpperCase();
            current.add(key);

            if (timeout) {
                clearTimeout(timeout)
                timeout = null;
            }

            setKeys(Array.from(current))
        }

        let timeout: NodeJS.Timeout | null = null;
        let keybind: string[] = []

        function onKeyRelease(event: KeyboardEvent) {
            if (!current) return;

            const key = (event.key || event.code).toUpperCase();

            if (!timeout) {
                keybind = Array.from(current)
                timeout = setTimeout(() => {
                    if (current.size == 0) {
                        timeout = null;
                        if (recordingKeys)
                            setSavedKeys(keybind)
                        setRecordingKeys(false)
                    }
                }, 200)
            }

            current.delete(key);

            setKeys(Array.from(current))
        }

        // Add key event listeners
        document.addEventListener("keydown", onKeyPress);
        document.addEventListener("keyup", onKeyRelease);

        return () => {
            document.removeEventListener("keydown", onKeyPress)
            document.removeEventListener("keyup", onKeyRelease);
        }
    }, [recordingKeys])

    useEffect(() => {
        if (isOpen) {
            nameRef.current?.blur()
        }
    }, [open])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        log(`${name}: ${value}`)

        if (name == "title") setProps({ ...props, sound: { ...props.sound, name: value } })
        if (name == "volume") setProps({ ...props, sound: { ...props.sound, config: { ...(props.sound.config ?? {}), volume: value } } })
    }

    const handleSave = async () => {
        if (props.sound.name) {
            const oldSound = initialProps.sound
            const newSound = props.sound

            if (JSON.stringify(oldSound) != JSON.stringify(newSound)) {
                updateSound(oldSound.file, props.category.name, newSound)
                save()
                close()

                // newSound.name = name;
                // newSound.keybind = savedKeys.join("+");

                // if (oldSound.config?.volume != volume) {
                //     newSound.config ??= {}
                //     newSound.config.volume = volume
                // }

                // newConfig.sounds[newSound.file] = newSound;

                // if (oldSound.name != newSound.name) log(`${newSound.file}: ${oldSound?.name} > ${newSound.name}`)

                // if (oldSound.keybind != newSound.keybind) {
                //     if (oldSound.keybind) {
                //         unregister(oldSound.keybind).then(() => {
                //             if (newSound.keybind) {
                //                 register(newSound.keybind, () => play(newSound))
                //             }
                //         })
                //     } else if (newSound.keybind) {
                //         register(newSound.keybind, () => play(newSound))
                //     }
                // }

                // if (oldSound.keybind != newSound.keybind || oldSound.name != newSound.name || oldSound.config?.volume != newSound.config?.volume) {
                //     setSelectedSound(null)
                //     saveConfig(newConfig)
                //     setConfig(newConfig)
                //     setSounds(Object.values(newConfig.sounds))
                // }
            } else {
                toast("Nothing has changed", { type: "warning" })
            }
        }
    }

    // const handleClick = () => {
    //     setRecordingKeys(!recordingKeys)
    // }

    return <Modal open={isOpen} setOpen={setIsOpen}>
        <div className="bg-[#303031] p-2">
            <button onClick={() => setIsOpen(false)} className="absolute right-0 top-0 m-2 border-none outline-none focus:outline-none p-0 bg-transparent text-2xl text-stone-500 hover:text-stone-400 transition-colors">
                <IoCloseSharp />
            </button>
            <p className="font-bold text-2xl mt-1">Modifier le son</p>
            <ul className="flex gap-2 flex-col">
                <li className="text-left flex flex-col gap-1 mt-8">
                    <label className="text-sm font-bold text-zinc-300">SOUND NAME</label>
                    <input name="title" onChange={handleChange} value={props.sound?.name} className="bg-zinc-900 rounded-sm p-2"></input>
                </li>
                <li className="text-left flex flex-col gap-1">
                    <label className="text-sm font-bold text-zinc-300">SOUND VOLUME</label>
                    <input name="volume" onChange={handleChange} value={props.sound?.config?.volume ?? 100} type="range" className=""></input>
                </li>
            </ul>
        </div>
        <div className="bg-zinc-800 p-3 flex justify-end gap-2">
            <Button onClick={close} type="discard">Discard</Button>
            <Button onClick={handleSave} type="validate">Save</Button>
        </div>
    </Modal>
}
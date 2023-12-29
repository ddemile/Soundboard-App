import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import isEqual from "lodash.isequal";
import { ChangeEvent, ElementRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { toast } from "sonner";
import useCategories from "../../hooks/useCategories.ts";
import useLog from "../../hooks/useLog.ts";
import useModal from "../../hooks/useModal.ts";
import findChangedProperties from "../../utils/findChangedProperties.ts";
import Button from "./Button.tsx";
import Modal from "./Modal.tsx";

export default function ConfigModal() {
    const nameRef = useRef<ElementRef<"h3">>(null)
    const [recordingKeys, setRecordingKeys] = useState<boolean>(false)
    const [_savedKeys, setSavedKeys] = useState<string[]>([])
    const [_keys, setKeys] = useState<string[]>([])
    const { isOpen, setIsOpen, close, props: initialProps } = useModal("config")
    const [props, setProps] = useState(initialProps)
    const { updateSound } = useCategories()
    const [emojiSelectorProps, setEmojiSelectorProps] = useState({ open: false, x: 0, y: 0 })
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

        if (name == "title") setProps({ ...props, sound: { ...props.sound, title: value } })
        if (name == "volume") setProps({ ...props, sound: { ...props.sound, config: { ...(props.sound.config ?? {}), volume: value } } })
    }

    const handleSave = async () => {
        if (props.sound.title) {
            const oldSound = initialProps.sound
            const newSound = props.sound

            if (!isEqual(oldSound, newSound)) {
                
                updateSound(oldSound.id, props.category.name, findChangedProperties(oldSound, newSound))
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
                toast.error("Nothing has changed")
            }
        }
    }

    // const handleClick = () => {
    //     setRecordingKeys(!recordingKeys)
    // }

    return <Modal open={isOpen} setOpen={setIsOpen} className="flex justify-center flex-col min-w-full min-h-screen bg-transparent">
        <div className="absolute z-30" style={{ top: emojiSelectorProps.y, left: emojiSelectorProps.x, display: emojiSelectorProps.open ? "inherit" : "none" }}>
            {emojiSelectorProps.open &&
                <EmojiPicker skinTonesDisabled emojiStyle={EmojiStyle.NATIVE} theme={Theme.DARK} onEmojiClick={({ emoji, names }) => {
                    setEmojiSelectorProps({ ...emojiSelectorProps, open: false })
                    setProps({ ...props, sound: { ...props.sound, emoji, emojiName: names[0].replace(/ /g, "_") } })
                }} />
            }
        </div>
        <div className="rounded-lg w-[440px] overflow-hidden mx-auto" onClick={() => setEmojiSelectorProps({ ...emojiSelectorProps, open: false })}>
            <div className="bg-[#303031] p-2 relative flex flex-col">
                <button onClick={() => setIsOpen(false)} className="absolute right-0 top-0 m-2 border-none outline-none focus:outline-none p-0 bg-transparent text-2xl text-stone-500 hover:text-stone-400 transition-colors">
                    <IoCloseSharp />
                </button>
                <p className="font-bold text-2xl mt-1">Edit sound</p>
                <ul className="flex gap-2 flex-col">
                    <li className="text-left flex gap-4 mt-8">
                        <div className="flex flex-col w-full">
                            <label className="text-sm font-bold text-zinc-300">SOUND NAME</label>
                            <input name="title" onChange={handleChange} value={props.sound?.title} className="bg-zinc-900 rounded-sm p-2"></input>
                        </div>
                        <div className="flex flex-col w-full">
                            <label className="text-sm font-bold text-zinc-300">EMOJI</label>
                            <p onClick={(e) => {
                                e.stopPropagation()
                                setEmojiSelectorProps({ open: true, x: e.pageX, y: e.pageY })
                            }} className="bg-zinc-900 rounded-sm p-2 flex cursor-pointer">
                                <input className="w-0" />
                                <span className="flex gap-2">
                                    <span>{props.sound?.emoji || "🎵"} </span>
                                    <span>:{props.sound?.emojiName || "musical_note"}:</span>
                                </span>
                            </p>
                        </div>
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
        </div>

    </Modal>
}
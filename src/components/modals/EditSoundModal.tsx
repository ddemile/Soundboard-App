import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import isEqual from "lodash.isequal";
import { ChangeEvent, ElementRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { toast } from "sonner";
import useCategories from "../../hooks/useCategories.ts";
import useLog from "../../hooks/useLog.ts";
import useModal from "../../hooks/useModal.ts";
import findChangedProperties from "../../utils/findChangedProperties.ts";
import Modal from "./Modal.tsx";
import { SmallModal } from "./SmallModal.tsx";

export default function EditSoundModal() {
    const nameRef = useRef<ElementRef<"h3">>(null)
    const { isOpen, setIsOpen, close, props: initialProps } = useModal("config")
    const [props, setProps] = useState(initialProps)
    const { updateSound } = useCategories()
    const [emojiSelectorProps, setEmojiSelectorProps] = useState({ open: false, x: 0, y: 0 })
    const log = useLog()

    useLayoutEffect(() => {
        setProps(initialProps)
    }, [initialProps])

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
            } else {
                toast.error("Nothing has changed")
            }
        }
    }

    return <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)}>
        <div className="absolute z-30" style={{ top: emojiSelectorProps.y, left: emojiSelectorProps.x, display: emojiSelectorProps.open ? "inherit" : "none" }}>
            {emojiSelectorProps.open &&
                <EmojiPicker skinTonesDisabled emojiStyle={EmojiStyle.NATIVE} theme={Theme.AUTO} onEmojiClick={({ emoji, names }) => {
                    setEmojiSelectorProps({ ...emojiSelectorProps, open: false })
                    setProps({ ...props, sound: { ...props.sound, emoji, emojiName: names[0].replace(/ /g, "_") } })
                }} />
            }
        </div>
        <SmallModal.Container onClick={() => setEmojiSelectorProps({ ...emojiSelectorProps, open: false })}>
            <SmallModal.Content>
                <button onClick={() => setIsOpen(false)} className="absolute right-0 top-0 m-2 border-none outline-none focus:outline-none p-0 bg-transparent text-2xl text-stone-500 hover:text-stone-400 transition-colors">
                    <IoCloseSharp />
                </button>
                <SmallModal.Title>Edit sound</SmallModal.Title>
                <ul className="flex gap-2 flex-col">
                    <li className="text-left flex gap-4 mt-8">
                        <div className="flex flex-col w-full">
                            <SmallModal.Label>SOUND NAME</SmallModal.Label>
                            <input name="title" onChange={handleChange} value={props.sound?.title} className="bg-zinc-300 dark:bg-zinc-900 rounded-sm p-2"></input>
                        </div>
                        <div className="flex flex-col w-full">
                            <SmallModal.Label>EMOJI</SmallModal.Label>
                            <p onClick={(e) => {
                                e.stopPropagation()
                                setEmojiSelectorProps({ open: true, x: e.pageX, y: e.pageY })
                            }} className="bg-zinc-300 dark:bg-zinc-900 rounded-sm p-2 flex cursor-pointer">
                                <input className="w-0" />
                                <span className="flex gap-2">
                                    <span>{props.sound?.emoji || "🎵"} </span>
                                    <span>:{props.sound?.emojiName || "musical_note"}:</span>
                                </span>
                            </p>
                        </div>
                    </li>
                    <li className="text-left flex flex-col gap-1">
                        <SmallModal.Label>SOUND VOLUME</SmallModal.Label>
                        <input name="volume" onChange={handleChange} value={props.sound?.config?.volume ?? 100} type="range" className=""></input>
                    </li>
                </ul>
            </SmallModal.Content>
            <SmallModal.Footer>
                <SmallModal.Button onClick={close} variant="discard">Discard</SmallModal.Button>
                <SmallModal.Button onClick={handleSave} variant="validate">Save</SmallModal.Button>
            </SmallModal.Footer>
        </SmallModal.Container>
    </Modal>
}
import { Slider } from "@/components/ui/slider.tsx";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import isEqual from "lodash.isequal";
import { ChangeEvent, ElementRef, FormEventHandler, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useCategories from "../../hooks/useCategories.ts";
import useLog from "../../hooks/useLog.ts";
import useModal from "../../hooks/useModal.ts";
import findChangedProperties from "../../utils/findChangedProperties.ts";
import { Button } from "../ui/button.tsx";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card.tsx";
import { Input } from "../ui/input.tsx";
import { Label } from "../ui/label.tsx";
import Modal from "./Modal.tsx";

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

    useEffect(() => {
        const listener: (this: Document, ev: MouseEvent) => void = (e) => {
          let element = e.target as HTMLElement;
          let contains = false;
          while (!contains && element != null) {
            contains = element?.classList.contains("EmojiPickerReact")
            element = element.parentElement!;
          }
    
          if (!contains) setEmojiSelectorProps({
            ...emojiSelectorProps,
            open: false
          })
        }
    
        document.addEventListener("click", listener)
    
        return () => {
          document.removeEventListener("click", listener)
        }
    }, [emojiSelectorProps])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target

        log(`${id}: ${value}`)

        if (id == "title") setProps({ ...props, sound: { ...props.sound, title: value } })
        if (id == "volume") setProps({ ...props, sound: { ...props.sound, config: { ...(props.sound.config ?? {}), volume: value } } })
    }

    const handleSave: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault()

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
        <form onSubmit={handleSave}>
            <Card>
                <CardHeader>
                    <CardTitle>Edit sound</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={props.sound?.title} onChange={handleChange} placeholder="Name of your project" />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label>Emoji</Label>
                            <Button id="emoji" type="button" variant="outline" onClick={(e) => {
                                e.stopPropagation()

                                setEmojiSelectorProps({ open: true, x: e.pageX, y: e.pageY })
                            }}>
                                <span>{props.sound?.emoji || "🎵"} </span>
                                <span className="overflow-hidden text-ellipsis">:{props.sound?.emojiName || "musical_note"}:</span>
                            </Button>
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="volume">Volume</Label>
                            <Slider id="volume" className="my-2" max={100} step={1} value={[props.sound?.config?.volume ?? 100]} onValueChange={(values) => setProps({ ...props, sound: { ...props.sound, config: { ...(props.sound.config ?? {}), volume: values[0].toString() } } })} />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                    <Button type="submit">Save</Button>
                </CardFooter>
            </Card>
        </form>
    </Modal>
}
import isEqual from "lodash.isequal";
import { ChangeEvent, ElementRef, FormEventHandler, MouseEventHandler, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as icons from "react-icons/bs";
import { toast } from "sonner";
import useCategories from "../../hooks/useCategories.ts";
import useModal from "../../hooks/useModal.ts";
import findChangedProperties from "../../utils/findChangedProperties.ts";
import IconSelector from "../IconSelector.tsx";
import { Button } from "../ui/button.tsx";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card.tsx";
import { Input } from "../ui/input.tsx";
import { Label } from "../ui/label.tsx";
import Modal from "./Modal.tsx";

export default function EditSoundModal() {
    const { isOpen, setIsOpen, close, props: initialProps } = useModal("edit-category")
    const [props, setProps] = useState(initialProps)
    const { categories, updateCategory } = useCategories()
    const [iconSelectorProps, setIconSelectorProps] = useState({ open: false, x: 0, y: 0})
    const Icon = icons[props?.icon as any as keyof typeof icons] ?? icons.BsSoundwave
    const selectorRef = useRef<ElementRef<"div">>(null)

    useLayoutEffect(() => {
        setProps(initialProps)
    }, [initialProps])

    useEffect(() => {
        const listener: (this: Document, ev: MouseEvent) => void = (e) => {
            let element = e.target as HTMLElement;
            let contains = false;
            while (!contains && element != null) {
                contains = element?.classList.contains("IconSelector")
                element = element.parentElement!;
            }
    
            if (!contains) setIconSelectorProps({
                ...iconSelectorProps,
                open: false
            })
        }
    
        document.addEventListener("click", listener)
    
        return () => {
            document.removeEventListener("click", listener)
        }
    }, [iconSelectorProps])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setProps({ ...props, [name]: value })
    }

    const handleSave: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault()

        const oldCategory = initialProps
        const newCategory = props

        if (!isEqual(oldCategory, newCategory)) {
            updateCategory(oldCategory.name, findChangedProperties(oldCategory, newCategory))
            close()
        } else {
            toast.error("Nothing has changed")
        }
    }

    const calculateSelectorPos = (intialPos: { x: number, y: number }) => {            
        const iconSelector = {
            width: 384,
            height: 322,
        }

        const bottomRight = {
            x: intialPos.x + iconSelector.width,
            y: intialPos.y + iconSelector.height,
        }

        const x = Math.min(window.innerWidth, bottomRight.x)

        const y = Math.min(window.innerHeight, bottomRight.y)

        return {
            x: x - iconSelector.width,
            y: y - iconSelector.height
        }
    }

    const handleShowSelector: MouseEventHandler<HTMLButtonElement> = (e) => {
        e.stopPropagation()

        const pos = calculateSelectorPos({ x: e.pageX, y: e.pageY })
                            
        setIconSelectorProps({ ...pos, open: true })
    }

    const canValidate = !isEqual(initialProps, props) && !categories.filter(({ name }) => name != initialProps.name).some(({ name }) => props?.name == name) && props.name?.trim()

    return <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)}>
        {iconSelectorProps.open && (
            <div ref={selectorRef} className="absolute z-30" style={{ top: iconSelectorProps.y, left: iconSelectorProps.x }}>
                <IconSelector onIconClick={({ name }) => { console.log(initialProps, props); setProps({ ...props, icon: name }); setIconSelectorProps({ ...iconSelectorProps, open: false}) }} />
            </div>
        )}
        <form onSubmit={handleSave}>
            <Card>
                <CardHeader>
                    <CardTitle>Edit category</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="name">Category name</Label>
                            <Input id="name" name="name" value={props?.name} onChange={handleChange} placeholder="Name of your project" />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label>Emoji</Label>
                            <Button id="emoji" type="button" variant="outline" onClick={handleShowSelector}>
                                <span className="flex justify-center items-center"><Icon /></span>
                                <span className="overflow-hidden text-ellipsis">:{props?.icon as string || "BsSoundwave"}:</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                    <Button type="submit" disabled={!canValidate}>Save</Button>
                </CardFooter>
            </Card>
        </form>
    </Modal>
}
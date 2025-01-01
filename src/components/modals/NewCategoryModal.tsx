import { ChangeEvent, ElementRef, FormEventHandler, MouseEventHandler, useEffect, useRef, useState } from "react"
import * as icons from "react-icons/bs"
import useCategories from "../../hooks/useCategories.ts"
import useModal from "../../hooks/useModal.ts"
import { CategoryData } from "../../pages/Home.tsx"
import IconSelector from "../IconSelector.tsx"
import { Button } from "../ui/button.tsx"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card.tsx"
import { Input } from "../ui/input.tsx"
import { Label } from "../ui/label.tsx"
import Modal from "./Modal.tsx"

export default function NewCategoryModal() {
    const { isOpen, setIsOpen, close } = useModal("new-category")
    const { categories, createCategory } = useCategories()
    const [category, setCategory] = useState<CategoryData>({ name: "", expanded: true, sounds: [] })
    const [iconSelectorProps, setIconSelectorProps] = useState({ open: false, x: 0, y: 0})
    const Icon = icons[category.icon as any as keyof typeof icons] ?? icons.BsSoundwave
    const selectorRef = useRef<ElementRef<"div">>(null)

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

        setCategory({ ...category, [name]: value })
    }

    const handleCreate: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault()

        createCategory(category)
        setCategory({ ...category, name: "" })
        close()
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

    return <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)}>
        {iconSelectorProps.open && (
            <div ref={selectorRef} className="absolute z-30" style={{ top: iconSelectorProps.y, left: iconSelectorProps.x }}>
                <IconSelector onIconClick={({ name }) => { setCategory({ ...category, icon: name } as any); setIconSelectorProps({ ...iconSelectorProps, open: false}) }} />
            </div>
        )}

        <form onSubmit={handleCreate}>
            <Card>
                <CardHeader>
                    <CardTitle>Create category</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="name">Category name</Label>
                            <Input id="name" name="name" value={category.name} onChange={handleChange} placeholder="Name of your project" />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label>Emoji</Label>
                            <Button id="emoji" type="button" variant="outline" onClick={handleShowSelector}>
                                <span className="flex justify-center items-center"><Icon /></span>
                                <span className="overflow-hidden text-ellipsis">:{category.icon as string || "BsSoundwave"}:</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                    <Button type="submit" disabled={categories.some(({ name }) => category.name == name) || !category.name.trim()}>Create</Button>
                </CardFooter>
            </Card>
        </form>
    </Modal>
}
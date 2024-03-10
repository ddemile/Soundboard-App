import { ChangeEvent, ElementRef, useRef, useState } from "react"
import * as icons from "react-icons/bs"
import { IoCloseSharp } from "react-icons/io5"
import useCategories from "../../hooks/useCategories.ts"
import useModal from "../../hooks/useModal.ts"
import { CategoryData } from "../../pages/Home.tsx"
import IconSelector from "../IconSelector.tsx"
import Modal from "./Modal.tsx"
import { SmallModal } from "./SmallModal.tsx"

export default function NewCategoryModal() {
    const { isOpen, setIsOpen, close } = useModal("new-category")
    const { categories, createCategory } = useCategories()
    const [category, setCategory] = useState<CategoryData>({ name: "", expanded: true, sounds: [] })
    const [iconSelectorProps, setIconSelectorProps] = useState({ open: false, x: 0, y: 0})
    const Icon = icons[category.icon as any as keyof typeof icons] ?? icons.BsSoundwave
    const selectorRef = useRef<ElementRef<"div">>(null)

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setCategory({ ...category, [name]: value })
    }

    const handleCreate = () => {
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
    
    return <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} onAfterClose={() => setCategory({ name: "", expanded: false, sounds: [], icon: "BsSoundwave" })}>
        {iconSelectorProps.open && (
            <div ref={selectorRef} className="absolute z-30" style={{ top: iconSelectorProps.y, left: iconSelectorProps.x }}>
                <IconSelector onIconClick={({ name }) => { setCategory({ ...category, icon: name } as any); setIconSelectorProps({ ...iconSelectorProps, open: false}) }} />
            </div>
        )}

        <SmallModal.Container onClick={() => setIconSelectorProps({ ...iconSelectorProps, open: false })}>
            <SmallModal.Content>
                <button onClick={() => setIsOpen(false)} className="absolute right-0 top-0 m-2 border-none outline-none focus:outline-none p-0 bg-transparent text-2xl text-stone-500 hover:text-stone-400 transition-colors">
                    <IoCloseSharp />
                </button>
                <SmallModal.Title>New category</SmallModal.Title>
                <ul className="flex gap-2 flex-col">
                    <li className="text-left flex gap-1 mt-8">
                        <div className="flex flex-col w-full">
                            <SmallModal.Label>CATEGORY NAME</SmallModal.Label>
                            <input name="name" onChange={handleChange} value={category.name} className="bg-zinc-300 dark:bg-zinc-900 rounded-sm p-2"></input>
                        </div>
                        <div className="flex flex-col w-full overflow-hidden">
                            <SmallModal.Label>EMOJI</SmallModal.Label>
                            <p onClick={(e) => {
                                e.stopPropagation()

                                const pos = calculateSelectorPos({ x: e.pageX, y: e.pageY })
                            
                                setIconSelectorProps({ ...pos, open: true })
                        
                            }} className="bg-zinc-300 dark:bg-zinc-900 rounded-sm p-2 flex cursor-pointer">
                                <input className="w-0" />
                                <span className="flex gap-2 overflow-hidden">
                                    <span className="flex justify-center items-center"><Icon /></span>
                                    <span className="overflow-hidden text-ellipsis">:{category.icon as string || "BsSoundwave"}:</span>
                                </span>
                            </p>
                        </div>
                    </li>
                </ul>
            </SmallModal.Content>
            <SmallModal.Footer>
                <SmallModal.Button onClick={close} variant="discard">Discard</SmallModal.Button>
                <SmallModal.Button onClick={handleCreate} disabled={categories.some(({ name }) => category.name == name) || !category.name.trim()} variant="validate">Create</SmallModal.Button>
            </SmallModal.Footer>
        </SmallModal.Container>

    </Modal >
}
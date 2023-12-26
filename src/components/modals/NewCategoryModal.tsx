import { ChangeEvent, useState } from "react"
import * as icons from "react-icons/bs"
import { IoCloseSharp } from "react-icons/io5"
import useCategories from "../../hooks/useCategories.ts"
import useModal from "../../hooks/useModal.ts"
import { CategoryData } from "../../pages/Home.tsx"
import IconSelector from "../IconSelector.tsx"
import Button from "./Button.tsx"
import Modal from "./Modal.tsx"

export default function NewCategoryModal() {
    const { isOpen, setIsOpen, close } = useModal("new-category")
    const { categories, createCategory, saveCategories } = useCategories()
    const [category, setCategory] = useState<CategoryData>({ name: "", expanded: true, sounds: [] })
    const [iconSelectorProps, setIconSelectorProps] = useState({ open: false, x: 0, y: 0 })
    const Icon = icons[category.icon as any as keyof typeof icons] ?? icons.BsSoundwave

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setCategory({ ...category, [name]: value })
    }

    const handleCreate = () => {
        createCategory(category)
        setCategory({ ...category, name: "" })
        saveCategories()
        close()
    }

    return <Modal open={isOpen} onClose={() => setCategory({ name: "", expanded: false, sounds: [], icon: "BsSoundwave" })} setOpen={setIsOpen} className="flex justify-center flex-col min-w-full min-h-screen bg-transparent">
        <div className="absolute z-30" style={{ top: iconSelectorProps.y, left: iconSelectorProps.x, display: iconSelectorProps.open ? "inherit" : "none" }}>
            {iconSelectorProps.open && <IconSelector onIconClick={({ name }) => setCategory({ ...category, icon: name } as any)} />}

        </div>
        <div className="rounded-lg w-[440px] overflow-hidden mx-auto" onClick={() => setIconSelectorProps({ ...iconSelectorProps, open: false })}>
            <div className="bg-[#303031] p-2 relative flex flex-col">
                <button onClick={() => setIsOpen(false)} className="absolute right-0 top-0 m-2 border-none outline-none focus:outline-none p-0 bg-transparent text-2xl text-stone-500 hover:text-stone-400 transition-colors">
                    <IoCloseSharp />
                </button>
                <p className="font-bold text-2xl mt-1">New category</p>
                <ul className="flex gap-2 flex-col">
                    <li className="text-left flex gap-1 mt-8">
                        <div className="flex flex-col w-full">
                            <label className="text-sm font-bold text-zinc-300">CATEGORY NAME</label>
                            <input name="name" onChange={handleChange} value={category.name} className="bg-zinc-900 rounded-sm p-2"></input>
                        </div>
                        <div className="flex flex-col w-full">
                            <label className="text-sm font-bold text-zinc-300">EMOJI</label>
                            <p onClick={(e) => {
                                e.stopPropagation()
                                setIconSelectorProps({ open: true, x: e.pageX, y: e.pageY })
                            }} className="bg-zinc-900 rounded-sm p-2 flex cursor-pointer">
                                <input className="w-0" />
                                <span className="flex gap-2">
                                    <span className="flex justify-center items-center"><Icon /></span>
                                    <span>:{category.icon as string || "BsSoundwave"}:</span>
                                </span>
                            </p>
                        </div>
                    </li>
                </ul>
            </div>
            <div className="bg-zinc-800 p-3 flex justify-end gap-2">
                <Button onClick={close} type="discard">Discard</Button>
                <Button onClick={handleCreate} disabled={categories.some(({ name }) => category.name == name) || !category.name.trim()} type="validate">Create</Button>
            </div>
        </div>

    </Modal >
}
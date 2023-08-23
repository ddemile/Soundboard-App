import { IoCloseSharp } from "react-icons/io5"
import useModal from "../../hooks/useModal.ts"
import Modal from "./Modal.tsx"
import { ChangeEvent, useState } from "react"
import Button from "./Button.tsx"
import { CategoryData } from "../../pages/Home.tsx"
import useCategories from "../../hooks/useCategories.ts"

export default function NewCategoryModal() {
    const { isOpen, setIsOpen, close } = useModal("new-category")
    const { categories, setCategories, save } = useCategories()
    const [category, setCategory] = useState<CategoryData>({ name: "", expanded: true, sounds: [] })

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setCategory({ ...category, [name]: value })
    }

    const handleCreate = () => {
        setCategories([ ...categories, category ])
        save()
        close()
    }

    return <Modal open={isOpen} setOpen={setIsOpen}>
        <div className="bg-[#303031] p-2">
            <button onClick={() => setIsOpen(false)} className="absolute right-0 top-0 m-2 border-none outline-none focus:outline-none p-0 bg-transparent text-2xl text-stone-500 hover:text-stone-400 transition-colors">
                <IoCloseSharp />
            </button>
            <p className="font-bold text-2xl mt-1">New category</p>
            <ul className="flex gap-2 flex-col">
                <li className="text-left flex flex-col gap-1 mt-8">
                    <label className="text-sm font-bold text-zinc-300">CATEGORY NAME</label>
                    <input name="name" onChange={handleChange} value={category.name} className="bg-zinc-900 rounded-sm p-2"></input>
                </li>
            </ul>
        </div>
        <div className="bg-zinc-800 p-3 flex justify-end gap-2">
            <Button onClick={close} type="discard">Discard</Button>
            <Button onClick={handleCreate} disabled={categories.some(({ name }) => category.name == name) || !category.name} type="validate">Create</Button>
        </div>
    </Modal>
}
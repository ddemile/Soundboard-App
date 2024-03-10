import isEqual from "lodash.isequal"
import { ChangeEvent, ElementRef, useLayoutEffect, useRef, useState } from "react"
import * as icons from "react-icons/bs"
import { IoCloseSharp } from "react-icons/io5"
import { toast } from "sonner"
import useCategories from "../../hooks/useCategories.ts"
import useModal from "../../hooks/useModal.ts"
import IconSelector from "../IconSelector.tsx"
import Button from "./Button.tsx"
import Modal from "./Modal.tsx"

export default function EditCategoryModal() {
    const { isOpen, setIsOpen, close, props: initialProps } = useModal("edit-category")
    const [props, setProps] = useState(initialProps)
    const { categories, updateCategory } = useCategories()
    const [iconSelectorProps, setIconSelectorProps] = useState({ open: false, x: 0, y: 0})
    const Icon = icons[props?.icon as any as keyof typeof icons] ?? icons.BsSoundwave
    const selectorRef = useRef<ElementRef<"div">>(null)

    useLayoutEffect(() => {
        console.log(initialProps)
        setProps(initialProps)
    }, [initialProps])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setProps({ ...props, [name]: value })
    }

    const handleSave = () => {
        const oldCategory = initialProps
        const newCategory = props

        if (!isEqual(oldCategory, newCategory)) {
            updateCategory(oldCategory.name, newCategory)
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

    const canValidate = !isEqual(initialProps, props) && !categories.filter(({ name }) => name != initialProps.name).some(({ name }) => props?.name == name) && props.name?.trim()
    
    return <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)}>
        {iconSelectorProps.open && (
            <div ref={selectorRef} className="absolute z-30" style={{ top: iconSelectorProps.y, left: iconSelectorProps.x }}>
                <IconSelector onIconClick={({ name }) => { console.log(initialProps, props); setProps({ ...props, icon: name }); setIconSelectorProps({ ...iconSelectorProps, open: false}) }} />
            </div>
        )}

        <div className="rounded-lg w-[440px] overflow-hidden mx-auto" onClick={() => setIconSelectorProps({ ...iconSelectorProps, open: false })}>
            <div className="bg-[#303031] p-2 relative flex flex-col">
                <button onClick={() => setIsOpen(false)} className="absolute right-0 top-0 m-2 border-none outline-none focus:outline-none p-0 bg-transparent text-2xl text-stone-500 hover:text-stone-400 transition-colors">
                    <IoCloseSharp />
                </button>
                <p className="font-bold text-2xl mt-1">Edit category</p>
                <ul className="flex gap-2 flex-col">
                    <li className="text-left flex gap-1 mt-8">
                        <div className="flex flex-col w-full">
                            <label className="text-sm font-bold text-zinc-300">CATEGORY NAME</label>
                            <input name="name" onChange={handleChange} value={props?.name} className="bg-zinc-900 rounded-sm p-2"></input>
                        </div>
                        <div className="flex flex-col w-full overflow-hidden">
                            <label className="text-sm font-bold text-zinc-300">EMOJI</label>
                            <p onClick={(e) => {
                                e.stopPropagation()

                                const pos = calculateSelectorPos({ x: e.pageX, y: e.pageY })
                            
                                setIconSelectorProps({ ...pos, open: true })
                        
                            }} className="bg-zinc-900 rounded-sm p-2 flex cursor-pointer">
                                <input className="w-0" />
                                <span className="flex gap-2 overflow-hidden">
                                    <span className="flex justify-center items-center"><Icon /></span>
                                    <span className="overflow-hidden text-ellipsis">:{props?.icon as string || "BsSoundwave"}:</span>
                                </span>
                            </p>
                        </div>
                    </li>
                </ul>
            </div>
            <div className="bg-zinc-800 p-3 flex justify-end gap-2">
                <Button onClick={close} type="discard">Discard</Button>
                <Button onClick={handleSave} disabled={!canValidate} type="validate">Save</Button>
            </div>
        </div>
    </Modal >
}
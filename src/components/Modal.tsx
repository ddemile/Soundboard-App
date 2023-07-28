import { Dispatch, MouseEventHandler, SetStateAction, useEffect, useRef, DialogHTMLAttributes, PropsWithChildren, useState, ElementRef } from "react"
import { twMerge } from "tailwind-merge"

export default function Modal(props: PropsWithChildren<{ open: boolean, setOpen: Dispatch<SetStateAction<boolean>>, onClose?: () => void, onOpen?: () => void } & DialogHTMLAttributes<HTMLDialogElement>>) {
    const dialogRef = useRef<ElementRef<"dialog">>(null)
    const [htmlProps, setHtmlProps] = useState<DialogHTMLAttributes<HTMLDialogElement>>({})
    const [isFirstUpdate, setIsFirstUpdate] = useState(true)

    useEffect(() => {
        const propsVar = { ...props } as any
        delete propsVar.setOpen
        delete propsVar.open
        setHtmlProps(propsVar)
    }, [])

    useEffect(() => {
        if (!props.open && !isFirstUpdate && props.onClose) {
            props.onClose()
        }

        if (props.open && !isFirstUpdate && props.onOpen) {
            props.onOpen()
        }

        if (dialogRef.current) {
            if (props.open) dialogRef.current.showModal()
            else dialogRef.current.close()
        }

        setIsFirstUpdate(false)
    }, [props.open])

    const handleClick: MouseEventHandler<HTMLDialogElement> = (e) => {
        if (e.target === dialogRef.current) {
            props.setOpen(false)
        }
    }

    return <dialog {...htmlProps} onClick={handleClick} style={props.open ? {} : { display: "none" }} className={twMerge("bg-main rounded-xl p-2", htmlProps.className)}  ref={dialogRef} onClose={() => props.setOpen(false)}>{props.children}</dialog>
}
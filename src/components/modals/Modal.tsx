import ReactModal, { Props } from "react-modal"
import { twMerge } from "tailwind-merge"

export default function Modal({ children, overlayClassName, className, ...props }: Props) {
    // Discord sizes: Width>440px Height>645px
    return <ReactModal {...props} closeTimeoutMS={200} className={twMerge("flex justify-center flex-col w-[350px] outline-hidden", className as string)} overlayClassName={twMerge("fixed inset-0 bg-black/30 dark:bg-black/10 flex justify-center items-center", overlayClassName as string)}>
        {children}
    </ReactModal>
}
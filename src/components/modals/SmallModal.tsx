import { DetailedHTMLProps, HTMLAttributes } from "react"
import { twMerge } from "tailwind-merge"

export function SmallModal() {

}

export function Container({ children, className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    return (
        <div {...props} className={twMerge("rounded-lg w-[440px] overflow-hidden mx-auto", className)}>
            {children}
        </div>
    )
}
SmallModal.Container = Container

export function Title({ children, className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    return (
        <p {...props} className={twMerge("font-bold text-2xl mt-1", className)}>{children}</p>
    )
}
SmallModal.Title = Title

export function Content({ children, className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    return (
        <div {...props} className={twMerge("bg-white dark:bg-[#303031] p-2 relative flex flex-col", className)}>
            {children}
        </div>
    )
}
SmallModal.Content = Content

export function Footer({ children, className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    return (
        <div {...props} className={twMerge("bg-neutral-200 dark:bg-zinc-800 p-3 flex justify-end gap-2", className)}>
            {children}
        </div>
    )
}
SmallModal.Footer = Footer

export function Label({ children, className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLLabelElement>, HTMLLabelElement>) {
    return (
        <label {...props} className={twMerge("text-sm font-bold text-zinc-500 dark:text-zinc-300", className)}>
            {children}
        </label>
    )
}
SmallModal.Label = Label

const buttonVariants = {
    discard: "p-1 rounded-sm bg-transparent focus:outline-hidden border-none hover:underline",
    validate: "disabled:bg-blue-500 dark:disabled:bg-blue-900 text-white disabled:text-zinc-300 dark:disabled:text-zinc-400 disabled:cursor-not-allowed rounded-md bg-blue-400 hover:bg-blue-500 transition-colors duration-300 p-1 px-4",
    danger: "text-white disabled:text-zinc-400 disabled:cursor-not-allowed rounded-md bg-red-500 dark:bg-red-800 hover:bg-red-600 dark:hover:bg-red-900 transition-colors duration-300 p-1 px-4"
}
export function Button({ children, variant, className, ...props }: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & { variant: keyof typeof buttonVariants}) {    
    return (
        <>
            <button {...props} className={twMerge(buttonVariants[variant], className)}>{children}</button>
        </>
    )
}
SmallModal.Button = Button
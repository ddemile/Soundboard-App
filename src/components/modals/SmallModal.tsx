import { DetailedHTMLProps, HTMLAttributes } from "react"
import { twMerge } from "tailwind-merge"

export function SmallModal() {

}

SmallModal.Container = function Container({ children, className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    return (
        <div {...props} className={twMerge("rounded-lg w-[440px] overflow-hidden mx-auto", className)}>
            {children}
        </div>
    )
}

SmallModal.Title = function Title({ children, className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    return (
        <p {...props} className={twMerge("font-bold text-2xl mt-1", className)}>{children}</p>
    )
}

SmallModal.Content = function Content({ children, className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    return (
        <div {...props} className={twMerge("bg-white dark:bg-[#303031] p-2 relative flex flex-col", className)}>
            {children}
        </div>
    )
}

SmallModal.Footer = function Footer({ children, className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    return (
        <div {...props} className={twMerge("bg-neutral-200 dark:bg-zinc-800 p-3 flex justify-end gap-2", className)}>
            {children}
        </div>
    )
}

SmallModal.Label = function Label({ children, className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLLabelElement>, HTMLLabelElement>) {
    return (
        <label {...props} className={twMerge("text-sm font-bold text-zinc-500 dark:text-zinc-300", className)}>
            {children}
        </label>
    )
}

SmallModal.Button = function Button({ children, variant, ...props }: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & { variant: "discard" | "validate" }) {
    return (
        <>
            {variant == "discard" ?
                <button {...props as any as React.ButtonHTMLAttributes<HTMLButtonElement>} className="p-1 rounded-sm bg-transparent focus:outline-none border-none hover:underline">{children}</button>
                :
                <button {...props as any as React.ButtonHTMLAttributes<HTMLButtonElement>} className="disabled:bg-blue-500 dark:disabled:bg-blue-900 text-white disabled:text-zinc-300 dark:disabled:text-zinc-400 disabled:cursor-not-allowed rounded-md bg-blue-400 hover:bg-blue-500 transition-colors duration-300 p-1 px-4">{children}</button>
            }
        </>
    )
}

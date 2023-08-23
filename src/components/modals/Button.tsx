import React from 'react'

export default function Button(props: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & { type: "discard" | "validate" }) {
    const { type, onClick, children } = props;

    return (
        <>
            {type == "discard" ?
                <button {...props as any as React.ButtonHTMLAttributes<HTMLButtonElement>} onClick={onClick} className="p-1 rounded-sm bg-transparent focus:outline-none border-none hover:underline">{children}</button>
                :
                <button {...props as any as React.ButtonHTMLAttributes<HTMLButtonElement>} onClick={onClick} className="disabled:bg-sky-800 disabled:text-zinc-400 disabled:cursor-not-allowed rounded-md bg-blue-500 p-1 px-4">{children}</button>
            }
        </>
    )
}

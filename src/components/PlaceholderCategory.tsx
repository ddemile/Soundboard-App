import { IconType } from "react-icons";
import * as icons from "react-icons/bs";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { Skeleton } from "./ui/skeleton.tsx";

export default function PlaceholderCategory({ ...props }: { name: string, items: number, icon?: IconType | keyof typeof icons;}) {
    const { name, items, icon } = props;

    const Icon: IconType = typeof icon == "function" ? icon : typeof icon == "string" && icon in icons ? icons[icon] : icons.BsSoundwave

    return (
        <div>
            <span className='ml-2.5 text-left flex items-center gap-1 font-semibold'><Icon /> {name} <button className='bg-transparent p-0 border-none outline-hidden focus:outline-hidden'><MdOutlineKeyboardArrowDown /></button></span>
            <ul className='mb-2 grid mx-2.5 mt-1 gap-2.5 grid-cols-150 list-none'>
                {new Array(items).fill(null).map((_, index) =>
                    <li key={index} className='*:col-start-1 *:row-start-1 grid rounded-lg overflow-hidden group h-10'>
                        <Skeleton className="h-full w-full" />
                    </li>
                )}
            </ul>
        </div>
    )
}
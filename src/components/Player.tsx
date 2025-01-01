import { BsPauseFill, BsPlayFill } from 'react-icons/bs'
import ProgressBar from './ProgressBar.tsx'

export default function Player() {
    return (
        <div className='flex gap-1 items-center justify-center m-auto w-1/6 shadow-lg rounded-full p-4 bg-stone-900 bottom-0 absolute'>
            <ProgressBar progressPercentage={50} className='rounded bg-stone-800' />
            <button className='bg-transparent aspect-square p-1 border-none outline-hidden focus:outline-hidden'>
                <BsPlayFill />
            </button>
            <button className='bg-transparent aspect-square p-1 border-none outline-hidden focus:outline-hidden'>
                <BsPauseFill />
            </button>
        </div>
    )
}

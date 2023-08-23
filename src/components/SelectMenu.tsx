export default function SelectMenu() {
    return <nav className="absolute top-0 w-screen left-0 flex justify-center">
        <ul className="flex mx-auto gap-2">
            <li className='relative p-1.5'><a className='font-normal text-white hover:text-white inline-block py-[10px] px-[5px] relative after:bottom-0 after:block after:h-1 after:bg-white after:rounded after:left-[25%] after:absolute after:transition-all after:duration-[0.3s] after:w-[50%] after:hover:w-full after:hover:left-0 cursor-pointer'>Home</a></li>
            <li className='relative p-1.5'><a className='font-normal text-white hover:text-white inline-block py-[10px] px-[5px] relative after:bottom-0 after:block after:h-1 after:bg-white after:rounded after:left-[25%] after:absolute after:transition-all after:duration-[0.3s] after:w-[50%] after:hover:w-full after:hover:left-0 cursor-pointer'>Discover</a></li>
            <li className='relative p-1.5'><a className='font-normal text-white hover:text-white inline-block py-[10px] px-[5px] relative after:bottom-0 after:block after:h-1 after:bg-white after:rounded after:left-[25%] after:absolute after:transition-all after:duration-[0.3s] after:w-[50%] after:hover:w-full after:hover:left-0 cursor-pointer'>Trending</a></li>
        </ul>
    </nav>
}
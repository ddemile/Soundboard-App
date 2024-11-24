import { TbSettingsFilled } from "react-icons/tb"
import { Link } from "react-router-dom"
import { twMerge } from "tailwind-merge"
import logo from "../../src-tauri/icons/icon.png"
import useModal from "../hooks/useModal.ts"

export default function Navbar() {
    const { open } = useModal("settings")

    return (
        <nav className="bg-white border-gray-200 dark:bg-[#181818] border-b dark:border-stone-800 sticky">
            <div className="flex flex-wrap items-center justify-between p-4">
                <button data-collapse-toggle="navbar-default" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
                    <span className="sr-only">Open main menu</span>
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1h15M1 7h15M1 13h15" />
                    </svg>
                </button>
                <div className="hidden w-full md:block md:w-auto" id="navbar-default">
                    <ul className="font-medium flex flex-col items-center p-4 md:p-0 mt-4 border border-gray-100 rounded-lg md:flex-row md:space-x-8 md:mt-0 md:border-0  dark:border-gray-700">
                        <li>
                            <Link to={"/"}>
                                <img src={logo} className="max-h-8"></img>
                            </Link>
                        </li>
                        <li>
                            <Link to="/" className={twMerge("block py-2 pl-3 pr-4 text-black rounded md:bg-transparent md:p-0 dark:text-white hover:text-orange-700 dark:hover:text-orange-500 transition-colors", window.location.pathname == "/" ? "md:text-orange-600 md:dark:text-orange-400" : "md:text-black md:dark:text-white")} aria-current="page">Home</Link>
                        </li>
                        <li>
                            <Link to="/discover" className={twMerge("block py-2 pl-3 pr-4 text-black rounded md:bg-transparent md:p-0 dark:text-white hover:text-orange-700 dark:hover:text-orange-500 transition-colors", window.location.pathname == "/discover" ? "md:text-orange-600 md:dark:text-orange-400" : "md:text-black md:dark:text-white")}>Discover</Link>
                        </li>
                        <li>
                            <Link to="/trending" className={twMerge("block py-2 pl-3 pr-4 text-black rounded md:bg-transparent md:p-0 dark:text-white hover:text-orange-700 dark:hover:text-orange-500 transition-colors", window.location.pathname == "/trending" ? "md:text-orange-600 md:dark:text-orange-400" : "md:text-black md:dark:text-white")}>Trending</Link>
                        </li>
                    </ul>
                </div>
                <button onClick={() => open()} type="button" className="inline-flex items-center p-0 w-8 h-8 justify-center text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
                    <span className="sr-only">Open main menu</span>
                    <span className="text-2xl">
                        <TbSettingsFilled />
                    </span>
                </button>
            </div>
        </nav>

    )
}

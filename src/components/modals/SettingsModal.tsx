import { useEffect, useState } from 'react'
import { ToastContainer, toast } from "react-toastify"
import useCategories from '../../hooks/useCategories.ts'
import useLog from '../../hooks/useLog.ts'
import useModal from '../../hooks/useModal.ts'
import { SoundEntry } from '../../pages/Home.tsx'
import Keybinds from '../../pages/settings/Keybinds.tsx'
import MyAccount from '../../pages/settings/MyAccount.tsx'
import Modal from './Modal.tsx'

const pages = {
  keybinds: Keybinds,
  myAccount: MyAccount
}

// Experimental (WIP)
export default function SettingsModal() {
  const { isOpen, setIsOpen } = useModal("settings");
  const { categories, updateSound, save } = useCategories()
  const [selected, setSelected] = useState<{ file?: string | null, keys: string[] }>({ file: null, keys: [] })
  const log = useLog()
  const [page, setPage] = useState<keyof typeof pages>("myAccount")

  const sounds = categories.reduce<SoundEntry[]>((accumulator, category) => [...accumulator, ...category.sounds], [])

  const Page = pages[page]

  const findSoundCategory = (soundFile: string) => {
    return categories.find(category => category.sounds.some(sound => sound.file == soundFile))
  }

  useEffect(() => {
    const current = new Set<string>()
    const currentDisplayed = new Set<string>()

    setSelected({ ...selected, keys: [] })

    function onKeyPress(event: KeyboardEvent) {
      if (!current) return;

      const key = (event.key || event.code).toUpperCase();
      current.add(key);
      currentDisplayed.add(key);

      if (timeout) {
        clearTimeout(timeout)
        timeout = null;
      }

      setSelected({ ...selected, keys: Array.from(current).map(key => capitalize(key)) })
    }

    let timeout: NodeJS.Timeout | null = null;

    function onKeyRelease(event: KeyboardEvent) {
      if (!current) return;

      const key = (event.key || event.code).toUpperCase();
      const keys = Array.from(currentDisplayed);
      const keybind = keys.map(key => capitalize(key)).join("+")

      if (!timeout) {
        timeout = setTimeout(() => {
          if (current.size == 0 && selected.file) {
            timeout = null;
            setSelected({ ...selected, file: null })
            if (sounds.map(sound => sound.keybind).includes(keybind)) return toast("A sound has already that keybind bind", { type: "error" })
            log(`Saved: ${keybind}`)
            updateSound(selected.file, findSoundCategory(selected.file)?.name!, { keybind })
            save()
          }
        }, 200)
      }

      current.delete(key);

      setSelected({ ...selected, keys: keys.map(key => capitalize(key)) })
    }

    // Add key event listeners
    document.addEventListener("keydown", onKeyPress);
    document.addEventListener("keyup", onKeyRelease);

    return () => {
      document.removeEventListener("keydown", onKeyPress)
      document.removeEventListener("keyup", onKeyRelease);
    }
  }, [selected.file])


  return (
    <Modal open={isOpen} setOpen={setIsOpen} className='w-full h-full bg-[#303031] flex'>
      <ToastContainer className={"m-6"} />

      <nav className='border-white border-opacity-20 border-r-2 h-full bg-[#232324] flex p-14 pr-0 flex-col'>
        <p className='text-left text-sm text-gray-300 px-2 font-semibold'>MAIN SETTINGS</p>
        <ul className='flex flex-col gap-0.5 text-left mr-1 w-48'>
          <li className='p-1.5 px-2 hover:bg-opacity-5 hover:bg-white cursor-pointer rounded-md' onClick={() => setPage("myAccount")}>My account</li>
          <li className='p-1.5 px-2 hover:bg-opacity-5 hover:bg-white cursor-pointer rounded-md' onClick={() => setPage("keybinds")}>Keybinds</li>
        </ul>
      </nav>
      <main className='p-14 px-10 overflow-y-auto h-full inline-block w-full'>
        <Page />
      </main>
      {/* <h3 className="text-xl font-semibold">Settings</h3>
      {(cookies.token && cookies.user) && <h5 className='text-sm'>Logged in as {cookies.user.username}</h5>}
      <div className="flex gap-2.5 flex-col">
        <div className="flex flex-col">
          <label className="text-left">Stop button keybind</label>
          <input type="text" name="keybind" className="p-1 rounded-sm border-2 border-[#3a3a3a]" value={keybind} onChange={(e) => setKeybind(e.target.value)} />
        </div>
        {(cookies.token && cookies.user) ?
          <>
          <div className="flex flex-col">
            <button onClick={() => { removeCookie("token"); removeCookie("user"); websocket.emit("logout") }}>Logout</button>
          </div>
          </>
          :
          <div className="flex flex-col">
            <button onClick={() => window.open(`https://ddemile.nano3.fr:4444/login?token=${cookies.token}`, "PopupWindow")}>Login</button>
          </div>
        }
      </div> */}
      {/* <ul>
        {sounds.map(sound => (
          <li key={sound.file} className='flex items-center justify-between'>
            <p>{sound.name}</p>
            <p style={{ border: `1px solid ${sound.file == selected.file ? "red" : "black"}` }} className="flex w-2/3 whitespace-nowrap overflow-hidden text-ellipsis items-center gap-1 rounded-sm bg-zinc-800 p-1 h-8" onClick={() => setSelected({ ...selected, file: sound.file })}>{(sound.file == selected.file ? selected.keys.join("+") : sound.keybind)} <button onClick={(e) => { e.stopPropagation(); setSelected({ ...selected, file: sound.file, keys: [] }); saveKeybind() }} className="ml-auto p-0"><AiOutlineClose /></button></p>
          </li>
        ))}
      </ul> */}

    </Modal >
  )
}

const capitalize = (word: string) => {
  return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1)
};
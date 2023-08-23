import { useEffect, useState } from 'react'
import Modal from './Modal.tsx'
import { register, unregister } from '@tauri-apps/api/globalShortcut'
import useConfig from '../../hooks/useConfig.ts'
import { AiOutlineClose } from "react-icons/ai"
import useWebsocket from '../../hooks/useWebsocket.ts'
import useModal from '../../hooks/useModal.ts'
import useCategories from '../../hooks/useCategories.ts'
import { SoundEntry } from '../../pages/Home.tsx'
import useLog from '../../hooks/useLog.ts'

// Experimental (WIP)
export default function SettingsModal() {
  const [keybind, setKeybind] = useState<string>("")
  const { config: getConfig, saveConfig } = useConfig()
  const [config, setConfig] = useState<any>();
  const { isOpen, setIsOpen } = useModal("settings");
  const { websocket } = useWebsocket()
  const { categories, updateSound, save } = useCategories()
  const [selected, setSelected] = useState<{ file?: string | null, keys: string[] }>({ file: null, keys: [] })
  const log = useLog()

  const sounds = categories.reduce<SoundEntry[]>((accumulator, category) => [...accumulator, ...category.sounds], [])

  const findSoundCategory = (soundFile: string) => {
    return categories.find(category => category.sounds.some(sound => sound.file == soundFile))
  }

  useEffect(() => {
    getConfig().then(config => {
      setConfig(config);

      if (config.stopKeybind) {
        setKeybind(config.stopKeybind)
      }
    })
  }, [])

  const saveKeybind = () => {
    if (selected.file) {
      updateSound(selected.file, findSoundCategory(selected.file)?.name!, { keybind: selected.keys.map(key => capitalize(key)).join("+") })
      save()
    }

  }

  useEffect(() => {
    const current = new Set<string>()
    const currentDisplayed = new Set<string>()

    setSelected({ ...selected, keys: [] })

    console.log("Hello")

    function onKeyPress(event: KeyboardEvent) {
      if (!current) return;

      const key = (event.key || event.code).toUpperCase();
      current.add(key);
      currentDisplayed.add(key);

      if (timeout) {
        clearTimeout(timeout)
        timeout = null;
      }

      console.log(Array.from(current))
      setSelected({ ...selected, keys: Array.from(current).map(key => capitalize(key)) })
    }

    let timeout: NodeJS.Timeout | null = null;
    let keybind: string[] = []

    function onKeyRelease(event: KeyboardEvent) {
      if (!current) return;

      const key = (event.key || event.code).toUpperCase();
      
      if (!timeout) {
        keybind = Array.from(currentDisplayed)
        timeout = setTimeout(() => {
          if (current.size == 0 && selected.file) {
            timeout = null;
            log(`Saved: ${keybind.map(key => capitalize(key)).join("+")}`)
            updateSound(selected.file, findSoundCategory(selected.file)?.name!, { keybind: keybind.map(key => capitalize(key)).join("+") })
            save()
            setSelected({ ...selected, file: null })
          }
        }, 200)
      }

      current.delete(key);

      console.log(Array.from(current))
      setSelected({ ...selected, keys: Array.from(currentDisplayed).map(key => capitalize(key)) })
    }

    // Add key event listeners
    document.addEventListener("keydown", onKeyPress);
    document.addEventListener("keyup", onKeyRelease);

    return () => {
      document.removeEventListener("keydown", onKeyPress)
      document.removeEventListener("keyup", onKeyRelease);
    }
  }, [selected.file])

  const handleClose = () => {
    const oldKeybind = config.stopKeybind

    if (oldKeybind != keybind) {
      if (oldKeybind) {
        unregister(oldKeybind)
      }

      if (keybind) {
        register(keybind, () => {
          websocket.emit("stopSound")
        })
      }

      saveConfig({ ...config, stopKeybind: keybind })
    }
  }

  return (
    <Modal open={isOpen} setOpen={setIsOpen} onClose={handleClose}>
      <h1>W.I.P</h1>
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
      <ul>
        {sounds.map(sound => (
          <li key={sound.file} className='flex items-center justify-between'>
            <p>{sound.name}</p>
            <p style={{ border: `1px solid ${sound.file == selected.file ? "red" : "black"}` }} className="flex w-2/3 whitespace-nowrap overflow-hidden text-ellipsis items-center gap-1 rounded-sm bg-zinc-800 p-1 h-8" onClick={() => setSelected({ ...selected, file: sound.file })}>{(sound.file == selected.file ? selected.keys.join("+") : sound.keybind)} <button onClick={(e) => { e.stopPropagation(); setSelected({ ...selected, file: sound.file, keys: [] }); saveKeybind() }} className="ml-auto p-0"><AiOutlineClose /></button></p>
          </li>
        ))}
      </ul>
    </Modal >
  )
}

const capitalize = (word: string) => {
  return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1)
};
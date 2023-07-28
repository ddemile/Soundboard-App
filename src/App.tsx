import { ElementRef, useEffect, useRef, useState } from 'react'
import './App.css'
import { register } from '@tauri-apps/api/globalShortcut';
import useWebsocket from './hooks/useWebsocket.ts';
import { BaseDirectory, writeBinaryFile, readBinaryFile } from '@tauri-apps/api/fs';
import useConfig from './hooks/useConfig.ts';
import { BsPlayFill, BsStopFill, BsPlus } from "react-icons/bs"
import { TbSettingsFilled } from "react-icons/tb"
import AppContext from './contexts/AppContext.tsx';
import ConfigModal from './components/ConfigModal.tsx';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import SettingsModal from './components/SettingsModal.tsx';
import useLog from './hooks/useLog.ts';
import UploadModal from './components/UploadModal.tsx';

export type SoundEntry = {
  name: string,
  file: `${string}.${string}`,
  keybind: string,
  config: {
    volume: number
  }
}

function App() {
  const websocket = useWebsocket()
  const inputRef = useRef<ElementRef<"input">>(null)
  const { config, saveConfig } = useConfig()
  const [sounds, setSounds] = useState<SoundEntry[]>([])
  const [keybind, setKeybind] = useState<string>()
  const [volume, setVolume] = useState<number>()
  const [configOpen, setConfigOpen] = useState<boolean>(false)
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)
  const [selectedSound, setSelectedSound] = useState<string | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false)
  const log = useLog({ })

  const fetchSounds = () => {
    config().then(config => {
      if (config.sounds) {
        (Object.values(config.sounds) as any).forEach((sound: SoundEntry) => {
          if (sound.keybind) {
            register(sound.keybind, () => play(sound))
          }
        })
        setSounds(Object.values(config.sounds))
      }
      if (config.stopKeybind) {
        setKeybind(config.stopKeybind)
        register(config.stopKeybind, () => {
          websocket.emit("stopSound")
        })
      }
    })
  }

  useEffect(() => {
    fetchSounds()
  }, [])

  const handleUpload = async () => {
    const files = inputRef.current?.files
    if (!files) return;

    let newConfig = await config();
    for await (let file of files) {
      if (file) {
        newConfig.sounds ??= {}
        if (file.name in newConfig.sounds) return toast(`${file.name} is already in the soundboard`, { type: "error" })

        const content = await readFileContent(file)
        if (content instanceof ArrayBuffer) {
          await writeBinaryFile(file.name, content, { dir: BaseDirectory.AppCache })

          const sound = {
            name: file.name.split(".")[0],
            file: file.name,
            keybind: ""
          }

          newConfig.sounds[file.name] = sound;
          log(`${sound.name} uploaded`)
          toast(`${sound.name} uploaded`, { type: "success" })
        }
      }
    }
    if (files.length > 1) {
      toast("All sounds uploaded", {
        type: "info"
      })
    }
    setSounds(Object.values(newConfig.sounds))
    saveConfig(newConfig)
  }

  const play = (sound: SoundEntry) => {
    const isCachedStart = Date.now()
    websocket.emit("isCached", sound.file, (isCached: boolean) => {
      const isCachedTime = Date.now() - isCachedStart
      log(isCached ? `${sound.name} is cached` : `${sound.name} is not cached`, `(${isCachedTime / 1000}s)`)
      if (isCached) {
        websocket.emit("playSound", sound.file, {
          volume: (sound.config?.volume / 100 ?? 1) * 0.75
        })
      } else {
        log(`Caching ${sound.name}`)
        const readStart = Date.now()
        readBinaryFile(sound.file, { dir: BaseDirectory.AppCache }).then(content => {
          const readTime = Date.now() - readStart
          log(`${sound.file} read in ${readTime / 1000}s`)
          const cachingStart = Date.now()
          websocket.emit("cacheSound", sound.file, content, () => {
            const cachingTime = Date.now() - cachingStart
            log(`${sound.name} cached in ${cachingTime / 1000}s`)
            websocket.emit("playSound", sound.file, {
              volume: (sound.config?.volume / 100 ?? 1) * 0.75
            })
          })
        })
      }
    })
  }

  return (
    <AppContext.Provider value={{ keybind, setKeybind, volume, setVolume, selectedSound, setSelectedSound, sounds, setSounds, play }}>
      <ToastContainer />
      <ConfigModal open={configOpen} setOpen={setConfigOpen} />
      <UploadModal open={uploadModalOpen} setOpen={setUploadModalOpen} />
      <SettingsModal open={settingsOpen} setOpen={setSettingsOpen} />
      <button className={`right-0 top-0 absolute bg-transparent aspect-square text-3xl p-1 m-0.5 border-none outline-none focus:outline-none ${settingsOpen && "[&>svg]:rotate-45"} [&>svg]:transition-all`} onClick={() => setSettingsOpen(true)}>
        <TbSettingsFilled />
      </button>
      {Array.isArray(sounds) && sounds.length > 0 ?
        <>
          <ul className='mb-2 grid gap-2.5 grid-cols-2 list-none lg:grid-cols-3'>
            {Array.isArray(sounds) && sounds.map(sound =>
              <li key={sound.file} className='bg-main max-w-[200px] flex gap-1 items-center p-1 rounded-3xl justify-between'>
                <button className='bg-stone-900 rounded-full aspect-square p-1' onClick={() => play(sound)}>
                  <BsPlayFill />
                </button>
                <span className='overflow-x-hidden whitespace-nowrap overflow-ellipsis'>{sound.name}</span>
                <button className='bg-stone-900 rounded-full aspect-square p-1' onClick={() => {
                  setKeybind(sound.keybind)
                  setVolume(sound.config?.volume)
                  setConfigOpen(true)
                  setSelectedSound(sound.file)
                }}><TbSettingsFilled /></button></li>
            )}
            <li className='bg-main max-w-[200px] flex gap-1 items-center p-1 rounded-3xl justify-center'>
              <input id='upload' type="file" ref={inputRef} hidden onChange={handleUpload} multiple={true} accept='audio/*' />
              <label className='bg-stone-900 rounded-full aspect-square p-1' onClick={(e) => {
                if (e.shiftKey) {
                  e.preventDefault()
                  setUploadModalOpen(true)
                }
              }} htmlFor="upload"><BsPlus /></label>
            </li>
          </ul>
          <button className='flex items-center justify-center m-auto w-12 aspect-square rounded-full bg-stone-900 [&>*>svg]:text-[25px]' onClick={() => websocket.emit("stopSound")}><span><BsStopFill /></span></button>
        </>
        :
        <div className='flex items-center justify-center'>
          <input id='upload' type="file" ref={inputRef} hidden onChange={handleUpload} multiple={true} accept='audio/*' />
          <label className='bg-stone-900 rounded-xl p-4 flex items-center gap-1' htmlFor="upload"><span className='rounded-full bg-stone-800 p-1'><BsPlus /></span><span>Add a sound</span></label>
        </div>
      }
    </AppContext.Provider>
  )
}

async function readFileContent(file: any): Promise<string | ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const fileContent = event.target?.result;
      if (fileContent) {
        resolve(fileContent);
      } else {
        reject()
      }

    };

    reader.readAsArrayBuffer(file);
  })
}

export default App

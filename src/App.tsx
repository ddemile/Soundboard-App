import { useEffect, useState } from 'react'
import './App.css'
import { register } from '@tauri-apps/api/globalShortcut';
import useWebsocket from './hooks/useWebsocket.ts';
import { BaseDirectory, readBinaryFile } from '@tauri-apps/api/fs';
import { TbSettingsFilled } from "react-icons/tb"
import useConfig from './hooks/useConfig.ts';
import AppContext from './contexts/AppContext.tsx';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import useLog from './hooks/useLog.ts';
import {
  onUpdaterEvent,
} from '@tauri-apps/api/updater'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { useCookies } from 'react-cookie';
import Navbar from './components/Navbar.tsx';
import Home, { CategoryData, SoundEntry } from './pages/Home.tsx';
import "react-contexify/dist/ReactContexify.css";
import SoundContextMenu from './components/contextMenus/SoundContextMenu.tsx';
import useCategories from './hooks/useCategories.ts';
import Discover from './pages/Discover.tsx';
import SettingsModal from './components/modals/SettingsModal.tsx';
import useModal from './hooks/useModal.ts';

await onUpdaterEvent(({ error, status }) => {
  // This will log all updater events, including status updates and errors.
  console.log('Updater event', error, status)
})

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/discover",
    element: <Discover />
  }
]);

function App() {
  const { websocket } = useWebsocket()
  const { config, saveConfig } = useConfig()
  const [sounds, setSounds] = useState<SoundEntry[]>([])
  const { setCategories } = useCategories()
  const [keybind, setKeybind] = useState<string>()
  const [volume, setVolume] = useState<number>()
  const [selectedSound, setSelectedSound] = useState<string | null>(null)
  const [_cookies, setCookie] = useCookies(["token", "user"]);
  const { isOpen, open } = useModal("settings")
  const log = useLog()

  const fetchSounds = () => {
    config().then(config => {
      // Update config to the new format
      if (config.sounds) {
        config.categories ??= []
        const categories = config.categories
        if (!categories.find((category: CategoryData) => category.name == "Favorite")) {
          categories.push({
            name: "Favorite",
            icon: "BsStarFill",
            sounds: [],
            expanded: true
          } satisfies CategoryData)
        }
        if (!categories.find((category: CategoryData) => category.name == "Default")) {
          categories.push({
            name: "Default",
            sounds: Object.values(config.sounds),
            expanded: true
          } satisfies CategoryData)
          delete config.sounds
        }

        saveConfig(config)
      }

      setCategories(config.categories)

      for (const category of config.categories) {
        category.sounds.forEach((sound: SoundEntry) => {
          if (sound.keybind) {
            log(`Registering: ${sound.keybind}`)
            register(sound.keybind, () => play(sound))
          }
        })
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

    const callback = ({ data }: MessageEvent<any>) => {
      log("Login callback received")
      if (data.token && data.maxAge && data.user) {
        setCookie("token", data.token, {
          maxAge: data.maxAge
        })
        setCookie("user", data.user, {
          maxAge: data.maxAge
        })

        websocket.emit("login", data.token)
      }
    }

    window.addEventListener("message", callback)

    return () => {
      window.removeEventListener("message", callback)
    }
  }, [])

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
      <SoundContextMenu />
      <SettingsModal />
      <button className={`right-0 bottom-0 absolute bg-transparent aspect-square text-3xl p-1 m-0.5 border-none outline-none focus:outline-none ${isOpen && "[&>svg]:rotate-45"} [&>svg]:transition-all`} onClick={() => open()}>
        <TbSettingsFilled />
      </button>
      <div className='h-screen flex flex-col'>
        <Navbar />
        <RouterProvider router={router} />
      </div>
    </AppContext.Provider>
  )
}

export default App

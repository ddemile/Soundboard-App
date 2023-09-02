import { BaseDirectory, readBinaryFile } from '@tauri-apps/api/fs';
import { register, unregisterAll } from '@tauri-apps/api/globalShortcut';
import { invoke } from '@tauri-apps/api/tauri';
import {
  onUpdaterEvent,
} from '@tauri-apps/api/updater';
import { useEffect, useLayoutEffect, useState } from 'react';
import "react-contexify/dist/ReactContexify.css";
import { useCookies } from 'react-cookie';
import {
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Navbar from './components/Navbar.tsx';
import SoundContextMenu from './components/contextMenus/SoundContextMenu.tsx';
import SettingsModal from './components/modals/SettingsModal.tsx';
import AppContext from './contexts/AppContext.tsx';
import useAudioPlayer from './hooks/useAudioPlayer.ts';
import useCategories from './hooks/useCategories.ts';
import useConfig from './hooks/useConfig.ts';
import useLog from './hooks/useLog.ts';
import useModal from './hooks/useModal.ts';
import useWebsocket from './hooks/useWebsocket.ts';
import Discover from './pages/Discover.tsx';
import Home, { CategoryData, SoundEntry } from './pages/Home.tsx';
import { BASE_API_URL } from './utils/constants.ts';
import fetchConfig from './utils/readConfig.ts';

document.addEventListener('DOMContentLoaded', () => {
  // This will wait for the window to load, but you could
  // run this function on whatever trigger you want
  invoke('close_splashscreen')
})

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
  const { updateConfig } = useConfig()
  const [keybind, setKeybind] = useState<string>()
  const [volume, setVolume] = useState<number>()
  const [selectedSound, setSelectedSound] = useState<string | null>(null)
  const [_cookies, setCookie] = useCookies(["token", "user"]);
  const { isOpen } = useModal("settings")
  const { categories } = useCategories()
  const player = useAudioPlayer()
  const log = useLog()

  const registerAll = async () => {
    const { stopKeybind } = config;

    await unregisterAll()

    log("Updating shortcuts")

    if (isOpen) return;

    for await (const category of categories) {
      category.sounds.forEach(async (sound: SoundEntry) => {
        if (sound.keybind) {
          await register(sound.keybind, () => play(sound))
        }
      })
    }

    if (stopKeybind) {
      setKeybind(stopKeybind)
      register(stopKeybind, () => {
        websocket.emit("stopSound")
      })
    }
  }

  useLayoutEffect(() => {
    if (config.audio.useSoundoardAppSounds) {
      websocket.on("playSound", (name: string, params?: { volume?: number }) => {
        const volume = Math.min(100, params?.volume ? params.volume * 100 : 75)

        player.play({ id: `distant-${name}`, url: `${BASE_API_URL}/public/${name}`, volume })
      })

      websocket.on("stopSound", () => {
        player.stop()
      })
    }

    return () => {
      websocket.off()
    }
  }, [config.audio.useSoundoardAppSounds])

  useEffect(() => {
    registerAll()
  }, [categories, isOpen])

  const fetchSounds = () => {
    fetchConfig().then(config => {
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
      }

      updateConfig(config)
      saveConfig()
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
      <div className='h-screen flex flex-col'>
        <Navbar />
        <RouterProvider router={router} />
      </div>
    </AppContext.Provider>
  )
}

export default App
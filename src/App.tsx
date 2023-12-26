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
import { Toaster } from 'sonner';
import { disable, enable, isEnabled } from "tauri-plugin-autostart-api";
import './App.css';
import Navbar from './components/Navbar.tsx';
import SoundContextMenu from './components/contextMenus/SoundContextMenu.tsx';
import MigrationModal from './components/modals/MigrationModal.tsx';
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

if (window.location.hostname == "localhost" && await isEnabled()) disable()
if (window.location.hostname != "localhost" && !await isEnabled()) enable()

const router = createBrowserRouter([
  {
    path: "/",
    element: <>
      <Navbar />
      <Home />
    </>,
  },
  {
    path: "/discover",
    element: <>
      <Navbar />
      <Discover />
    </>
  }
]);

let migrationChecked = false;

function App() {
  const { websocket } = useWebsocket()
  const { config, saveConfig, getConfig, loaded } = useConfig()
  const [sounds, setSounds] = useState<SoundEntry[]>([])
  const { updateConfig, setLoaded } = useConfig()
  const [keybind, setKeybind] = useState<string>()
  const [volume, setVolume] = useState<number>()
  const [selectedSound, setSelectedSound] = useState<string | null>(null)
  const [cookies, setCookie] = useCookies(["token", "user"]);
  const { isOpen } = useModal("settings")
  const { setIsOpen } = useModal("migration")
  const { categories, setCategories } = useCategories()
  const player = useAudioPlayer()
  const log = useLog()

  useEffect(() => {
    websocket.emit("web_client_categories", config.categories)
  }, [config])

  useEffect(() => {
    if (migrationChecked || !loaded) return

    if (!config.migrated && config.categories.length > 0) {
      setIsOpen(true)
    }

    migrationChecked = true;
  }, [config])

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
        log("Stop sound")
        websocket.emit("stopSound")
      })
    }
  }

  useLayoutEffect(() => {
    if (config.audio.useSoundoardAppSounds) {
      websocket.on("playSound", (id: string, params?: { volume?: number }) => {
        log(`Playing: ${id}`)

        const volume = Math.min(100, params?.volume ? params.volume * 100 : 75) * config.audio.soundsVolume / 100

        player.play({ id: `distant-${id}`, url: `${BASE_API_URL}/sounds/${id}`, volume })
      })

      websocket.on("stopSound", () => {
        player.stop()
      })
    }

    websocket.on("init", (auth) => {
      websocket.auth = { ...websocket.auth, ...auth }
    })

    websocket.on("init_categories", (categories) => {
      setCategories(categories)
    })

    websocket.on("web_client_connect", () => {
      websocket.emit("web_client_categories", getConfig().categories)
    })

    websocket.on("web_client_play", (sound) => {
      play(sound)
    })

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
      config.categories ??= []
      const categories = config.categories

      let favoritesCategory = categories.find((category: CategoryData) => category.name == "Favorite")
      if (!favoritesCategory) {
        favoritesCategory = {
          name: "Favorite",
          icon: "BsStarFill",
          sounds: [],
          expanded: true
        } satisfies CategoryData

        categories.push(favoritesCategory)
      }

      let defaultCategory = categories.find((category: CategoryData) => category.name == "Default")
      if (!defaultCategory) {
        defaultCategory = {
          name: "Default",
          sounds: [],
          expanded: true
        } satisfies CategoryData
        
        categories.push(defaultCategory)
      }

      if (config.sounds) {
        defaultCategory.sounds = Object.values(config.sounds)
        delete config.sounds
      }

      updateConfig(config)
      setLoaded(true);
      saveConfig()
    })
  }

  useEffect(() => {
    fetchSounds()

    if (cookies.token && cookies.user) {
      websocket.emit("login", cookies.token)
      log(`Logged in as ${cookies.user.username}`)
    }

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
    websocket.emit("playSound", sound.id, {
      volume: (sound.config?.volume / 100 ?? 1) * 0.75
    })
  }

  return (
    <AppContext.Provider value={{ keybind, setKeybind, volume, setVolume, selectedSound, setSelectedSound, sounds, setSounds, play }}>
      <Toaster richColors />
      <SoundContextMenu />
      <SettingsModal />
      <MigrationModal />
      <div className='h-screen flex flex-col'>
        <RouterProvider router={router} />
      </div>
    </AppContext.Provider>
  )
}

export default App
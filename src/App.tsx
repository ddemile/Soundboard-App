import { register, unregisterAll } from '@tauri-apps/api/globalShortcut';
import { invoke } from '@tauri-apps/api/tauri';
import {
  onUpdaterEvent,
} from '@tauri-apps/api/updater';
import { useEffect, useLayoutEffect, useState } from 'react';
import "react-contexify/dist/ReactContexify.css";
import { useCookies } from 'react-cookie';
import Modal from "react-modal";
import {
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";
import { Toaster } from 'sonner';
import { disable, enable, isEnabled } from "tauri-plugin-autostart-api";
import './App.css';
import Navbar from './components/Navbar.tsx';
import SoundContextMenu from './components/contextMenus/SoundContextMenu.tsx';
import MigrationModal from './components/modals/MigrationModal.tsx';
import SettingsModal from './components/modals/SettingsModal.tsx';
import AppContext from './contexts/AppContext.tsx';
import { ConfirmContextProvider } from './contexts/ConfirmContext.tsx';
import useAudioPlayer from './hooks/useAudioPlayer.ts';
import useCategories, { useCategoriesStore } from './hooks/useCategories.ts';
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

Modal.setAppElement("#root")

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
let dataDeleted = false;
let appReady = false;

function App() {
  const { websocket } = useWebsocket()
  const { config, saveConfig, loaded } = useConfig()
  const [sounds, setSounds] = useState<SoundEntry[]>([])
  const { updateConfig, setLoaded } = useConfig()
  const [keybind, setKeybind] = useState<string>()
  const [volume, setVolume] = useState<number>()
  const [selectedSound, setSelectedSound] = useState<string | null>(null)
  const [cookies, setCookie] = useCookies(["token", "user"]);
  const { isOpen } = useModal("settings")
  const { setIsOpen } = useModal("migration")
  const { categories } = useCategories()
  const store = useCategoriesStore()
  const player = useAudioPlayer()
  const log = useLog()

  useEffect(() => {
    if (migrationChecked || !loaded || !appReady) return

    const sounds = categories.reduce<SoundEntry[]>((accumulator, category) => [...accumulator, ...category.sounds.map(sound => ({ ...sound, category: category.name }))], []);

    if (!config.migrated && config.categories.length > 0 && sounds.length == 0) {
      setIsOpen(true)
    }

    migrationChecked = true;
  }, [config, categories])

  const registerAll = async () => {
    const { stopKeybind } = config;

    await unregisterAll()

    log("Updating shortcuts")

    if (isOpen) return;

    for await (const category of store.categories) {
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
      if (appReady) return;

      store.setCategories(categories)
      appReady = true;
    })

    websocket.on("deprecated_set_categories", (categories) => {
      store.setCategories(categories);
    })

    websocket.on("web_client_connect", () => {
      log("Web client connected")
    })

    websocket.on("update_category", (categoryName, newProps) => {
      store.updateCategory(categoryName, newProps)
    })

    websocket.on("create_category", (category) => {
      store.createCategory(category)
    })

    websocket.on("delete_category", (categoryName) => {
      store.deleteCategory(categoryName)
    })

    websocket.on("add_sound", (sound) => {
      store.addSound(sound, sound.category)
    })

    websocket.on("update_sound", (soundId, newProps) => {
      const sounds = store.getCategories().reduce<SoundEntry[]>((accumulator, category) => [...accumulator, ...category.sounds.map(sound => ({ ...sound, category: category.name }))], [])

      const sound = sounds.find(sound => sound.id == soundId)

      store.updateSound(soundId, sound?.category!, newProps)
    })

    websocket.on("delete_sound", (soundId) => {
      store.deleteSound(soundId)
    })

    return () => {
      websocket.off()
    }
  }, [config.audio])

  useEffect(() => {
    registerAll()
  }, [store.categories, isOpen])

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

    const callback = ({ data }: MessageEvent<any>): boolean => {
      log("Login callback received")

      if (data.token && data.maxAge && data.user) {
        setCookie("token", data.token, {
          maxAge: data.maxAge
        })
        setCookie("user", data.user, {
          maxAge: data.maxAge
        })

        websocket.emit("login", data.token)

        return true;
      }

      return false;
    }

    window.addEventListener("message", callback)

    const url = new URL(document.location as any);

    const searchParams = url.searchParams

    const hasData = searchParams.has("data")

    if (!cookies.user && !hasData && !dataDeleted) {
      window.location.replace(`https://ddemile.nano3.fr:4444/login?redirect=${encodeURIComponent(window.location.href)}`)
    }

    if (hasData) {
      try {
        if (callback({ data: JSON.parse(searchParams.get("data")!) } as any)) {
          searchParams.delete("data");
          dataDeleted = true;
          history.pushState({}, "", url.toString())
        }
      } catch (e) {
        console.error(e)
      }
    }

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
      <ConfirmContextProvider>
        <Toaster richColors />
        <SoundContextMenu />
        <SettingsModal />
        <MigrationModal />
        <div className='h-screen flex flex-col'>
          <RouterProvider router={router} />
        </div>
      </ConfirmContextProvider>
    </AppContext.Provider>
  )
}

export default App
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import { useEffect, useLayoutEffect, useState } from 'react';
import "react-contexify/dist/ReactContexify.css";
import { useCookies } from 'react-cookie';
import Modal from "react-modal";
import {
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";
import { Toaster } from 'sonner';
import './App.css';
import Navbar from './components/Navbar.tsx';
import SoundContextMenu from './components/contextMenus/SoundContextMenu.tsx';
import SettingsModal from './components/modals/SettingsModal.tsx';
import AppContext from './contexts/AppContext.tsx';
import { ConfirmContextProvider } from './contexts/ConfirmContext.tsx';
import useAudioPlayer from './hooks/useAudioPlayer.ts';
import { useCategoriesStore } from './hooks/useCategories.ts';
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

const update = await check();
if (update) {
  console.log(
    `found update ${update.version} from ${update.date} with notes ${update.body}`
  );
  let downloaded = 0;
  let contentLength = 0;
  // alternatively we could also call update.download() and update.install() separately
  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        contentLength = event.data.contentLength!;
        console.log(`started downloading ${event.data.contentLength} bytes`);
        break;
      case 'Progress':
        downloaded += event.data.chunkLength;
        console.log(`downloaded ${downloaded} from ${contentLength}`);
        break;
      case 'Finished':
        console.log('download finished');
        break;
    }
  });

  console.log('update installed');
  await relaunch();
}

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

const queryClient = new QueryClient()

let dataDeleted = false;
let appReady = false;
let initialized = false;

function App() {
  const { websocket } = useWebsocket()
  const { config, saveConfig } = useConfig()
  const [sounds, setSounds] = useState<SoundEntry[]>([])
  const { updateConfig, setLoaded } = useConfig()
  const [keybind, setKeybind] = useState<string>()
  const [volume, setVolume] = useState<number>()
  const [selectedSound, setSelectedSound] = useState<string | null>(null)
  const [cookies, setCookie] = useCookies(["token", "user"]);
  const { isOpen } = useModal("settings")
  const store = useCategoriesStore()
  const player = useAudioPlayer()
  const log = useLog()

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

    websocket.on("move_sound", (soundId, categoryName) => {
      store.moveSound(soundId, categoryName)
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
    if (initialized) return;

    initialized = true;

    fetchSounds()

    if (cookies.token && cookies.user) {
      authenticate(cookies.token)
      log(`Logged in as ${cookies.user.username}`)
    }

    const callback = ({ data }: MessageEvent<any>): boolean => {
      log("Login callback received")

      if (data.token && data.maxAge && data.user) {
        setCookie("token", data.token, {
          maxAge: data.maxAge
        })

        authenticate(data.token)

        return true;
      }

      return false;
    }

    function authenticate(token: string) {
      websocket.emitWithAck("login", token).then(({ user, maxAge }: { user: any, maxAge: number }) => {
        setCookie("user", user, { maxAge })
      })
    }

    window.addEventListener("message", callback)

    const url = new URL(document.location as any);

    const searchParams = url.searchParams

    const hasData = searchParams.has("data")

    if (!cookies.user && !hasData && !dataDeleted) {
      window.location.replace(`${BASE_API_URL}/login?redirect=${encodeURIComponent(window.location.href)}`)
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
      volume: (sound.config?.volume / 100 || 1) * 0.75
    })
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={{ keybind, setKeybind, volume, setVolume, selectedSound, setSelectedSound, sounds, setSounds, play }}>
        <ConfirmContextProvider>
          <Toaster richColors />
          <SoundContextMenu />
          <SettingsModal />
          <div className='h-screen flex flex-col'>

            {/* <div data-tauri-drag-region className="titlebar h-8 bg-[#1f2022] select-none flex justify-end top-0 left-0 right-0">
            <div className="titlebar-button inline-flex justify-center items-center w-12 h-[30px] hover:bg-[#2b2d30]" id="titlebar-minimize">
            <img
            src="https://api.iconify.design/mdi:window-minimize.svg"
            color='white'
            alt="minimize"
            />
            </div>
            <div className="titlebar-button inline-flex justify-center items-center w-12 h-[30px] hover:bg-[#2b2d30]" id="titlebar-maximize">
            <img
            src="https://api.iconify.design/mdi:window-maximize.svg"
            alt="maximize"
            />
            </div>
            <div className="titlebar-button inline-flex justify-center items-center w-12 h-[30px] hover:bg-[#2b2d30]" id="titlebar-close">
            <img src="https://api.iconify.design/mdi:close.svg" alt="close" />
            </div>
          </div> */}

            <RouterProvider router={router} />
          </div>
        </ConfirmContextProvider>
      </AppContext.Provider>
    </QueryClientProvider>
  )
}

export default App
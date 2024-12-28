import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import hotkeys from "hotkeys-js";
import { useEffect, useLayoutEffect, useState } from 'react';
import "react-contexify/dist/ReactContexify.css";
import { useCookies } from 'react-cookie';
import Modal from "react-modal";
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";
import { toast, Toaster } from 'sonner';
import './App.css';
import SoundContextMenu from './components/contextMenus/SoundContextMenu.tsx';
import GenerateCodeModal from './components/modals/GenerateCodeModal.tsx';
import ImageViewerModal from './components/modals/ImageViewerModal.tsx';
import SearchBarModal from './components/modals/SearchBarModal.tsx';
import SettingsModal from './components/modals/SettingsModal.tsx';
import Navbar from './components/Navbar.tsx';
import Spinner from './components/Spinner.tsx';
import { ThemeProvider } from './components/theme-provider.tsx';
import AppContext from './contexts/AppContext.tsx';
import { ConfirmContextProvider } from './contexts/ConfirmContext.tsx';
import useAudioPlayer from './hooks/useAudioPlayer.ts';
import useAuth from './hooks/useAuth.ts';
import { useCategoriesStore } from './hooks/useCategories.ts';
import useConfig from './hooks/useConfig.ts';
import useLog from './hooks/useLog.ts';
import useModal from './hooks/useModal.ts';
import useWebsocket, { SocketStatus } from './hooks/useWebsocket.ts';
import Discover from './pages/Discover.tsx';
import Home, { SoundEntry } from './pages/Home.tsx';
import Landing from './pages/Landing.tsx';
import WorkInProgress from './pages/WorkInProgress.tsx';
import { BASE_API_URL } from './utils/constants.ts';
import fetchConfig from './utils/readConfig.ts';

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
      {import.meta.env.DEV ? <Discover /> : <WorkInProgress />}
    </>
  },
  {
    path: "/trending",
    element: <>
      <Navbar />
      {import.meta.env.DEV ? <h1>Trending page</h1> : <WorkInProgress />}
    </>
  },
  {
    path: "/landing",
    element: <Landing />
  }
]);

const queryClient = new QueryClient()

let appReady = false;
let initialized = false;

function App() {
  const { websocket, status } = useWebsocket()
  const { config } = useConfig()
  const [sounds, setSounds] = useState<SoundEntry[]>([])
  const [keybind, setKeybind] = useState<string>()
  const [volume, setVolume] = useState<number>()
  const { setConfig, setLoaded } = useConfig()
  const [selectedSound, setSelectedSound] = useState<string | null>(null)
  const [cookies] = useCookies(["token", "user"]);
  const { isOpen } = useModal("settings")
  const { open: showSearchBar } = useModal("searchBar")
  const store = useCategoriesStore()
  const player = useAudioPlayer()
  const { authenticate } = useAuth()
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
        websocket.emit("stop_sound")
      })
    }
  }

  useLayoutEffect(() => {
    if (config.audio.useSoundoardAppSounds) {
      websocket.on("play_sound", (id: string, params?: { volume?: number }) => {
        log(`Playing: ${id}`)

        const volume = Math.min(100, params?.volume ? params.volume * 100 : 75) * config.audio.soundsVolume / 100

        player.play({ id: `distant-${id}`, url: `${BASE_API_URL}/sounds/${id}`, volume })
      })

      websocket.on("stop_sound", () => {
        player.stop()
      })
    }

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
      delete newProps["expanded"]
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

    websocket.on("error", ({ message }) => {
      if (toast.getHistory().find(toast => typeof toast.id == "string" && toast.id.startsWith("slow-down") && Date.now() - Number(toast.id.split("/")[1]) < 10000)) return

      toast.error(message, {
        id: `slow-down/${Date.now()}`,
      })
    })

    return () => {
      websocket.off()
    }
  }, [config.audio])

  useEffect(() => {
    registerAll()
  }, [store.categories, isOpen])

  useEffect(() => {
    if (initialized) return;

    initialized = true;

    hotkeys("ctrl+f", (event) => {
      event.preventDefault()

      showSearchBar()
    })

    fetchConfig().then((config) => {
      setConfig(config)
      setLoaded(true)
    })

    if (cookies.token) authenticate()
  }, [])

  const play = (sound: SoundEntry) => {
    websocket.emit("play_sound", sound.id, {
      volume: (sound.config?.volume / 100 || 1) * 0.75
    })
  }

  return (
    <ThemeProvider defaultTheme='system' storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AppContext.Provider value={{ keybind, setKeybind, volume, setVolume, selectedSound, setSelectedSound, sounds, setSounds, play }}>
          <ConfirmContextProvider>
            <div className='bg-white dark:bg-[#181818]'>
              <Toaster richColors />
              <SoundContextMenu />
              <SettingsModal />
              <ImageViewerModal />
              <GenerateCodeModal />
              <SearchBarModal />
              <div className='h-screen flex flex-col'>
                <RouterProvider router={router} />
              </div>
              {status == SocketStatus.Reconnecting && (
                <div className='absolute top-0 left-0 w-screen h-screen flex items-center justify-center bg-white dark:bg-[#181818]'>
                  <div className='flex flex-col items-center'>
                    <Spinner />                
                    <div className='flex items-center gap-2 mt-2 text-xl'>
                      <p>Connecting to server...</p>
                    </div>
                    <p className='text-lg text-gray-500 dark:text-gray-400'>Please wait while we connect to the server</p>
                  </div>
                </div>
              )}
            </div>
          </ConfirmContextProvider>
        </AppContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
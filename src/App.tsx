import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { currentMonitor, getAllWindows, LogicalPosition } from "@tauri-apps/api/window";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import hotkeys from "hotkeys-js";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Modal from "react-modal";
import {
  createBrowserRouter,
  RouterProvider
} from "react-router";
import { toast, Toaster } from 'sonner';
import './App.css';
import GenerateCodeModal from './components/modals/GenerateCodeModal.tsx';
import ImageViewerModal from './components/modals/ImageViewerModal.tsx';
import SearchBarModal from './components/modals/SearchBarModal.tsx';
import SettingsModal from './components/modals/SettingsModal.tsx';
import Navbar from './components/Navbar.tsx';
import Spinner from './components/Spinner.tsx';
import AppContext from './contexts/AppContext.tsx';
import { ConfirmContextProvider } from './contexts/ConfirmContext.tsx';
import useAudioPlayer from './hooks/useAudioPlayer.ts';
import useAuthStore from './hooks/useAuthStore.ts';
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
import { createLogger } from "./utils/logging.ts";
import { getActiveMonitor } from "./utils/monitors.ts";

if (import.meta.env.PROD) {
  const log = createLogger({ name: "Updater", debugColor: "yellow" })

  check().then(async (update) => {
    if (!update) return

    log(
      `Found update ${update.version} from ${update.date} with notes ${update.body}`
    );
    let downloaded = 0;
    let contentLength = 0;
    // alternatively we could also call update.download() and update.install() separately
    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          contentLength = event.data.contentLength!;
          log(`Started downloading ${event.data.contentLength} bytes`);
          break;
        case 'Progress':
          downloaded += event.data.chunkLength;
          log(`Downloaded ${downloaded} from ${contentLength}`);
          break;
        case 'Finished':
          log('Download finished');
          break;
      }
    });

    log('Update installed');
    await relaunch();
  })
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

let appReady = false;
let initialized = false;

const overlayWindow = (await getAllWindows()).find(window => window.label == "overlay")!;

function App() {
  const { websocket, status, setStatus } = useWebsocket()
  const { config } = useConfig()
  const [sounds, setSounds] = useState<SoundEntry[]>([])
  const [keybind, setKeybind] = useState<string>()
  const [volume, setVolume] = useState<number>()
  const { loadConfig } = useConfig()
  const [selectedSound, setSelectedSound] = useState<string | null>(null)
  const { isOpen } = useModal("settings")
  const { open: showSearchBar } = useModal("searchBar")
  const store = useCategoriesStore()
  const player = useAudioPlayer()
  const authStore = useAuthStore()
  const log = useLog()
  const hoveredSoundId = useRef<string>(null)

  const handleClose = async () => {
    const { categories } = useCategoriesStore.getState()

    overlayWindow.hide();
    await invoke("restore_focused_window");

    const favoriteCategory = categories.find(category => category.name == "Favorite");

    if (favoriteCategory && hoveredSoundId.current != null) {
      const sound = favoriteCategory.sounds.find(sound => sound.id == hoveredSoundId.current)!;
      
      play(sound)
    }
  }

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

    const handlePress = async () => {
      const monitor = await getActiveMonitor();

      if (!monitor) return;

      await overlayWindow.setPosition(monitor.position);
      await overlayWindow.setSize(monitor.size);

      if (config.overlay.teleportMouseToCenter) {
        await overlayWindow.setCursorPosition(new LogicalPosition(monitor.size.width / 2, monitor.size.height / 2))
      }
    }

    await register('CommandOrControl+Shift+C', async (event) => {
      if (event.state === "Pressed") {
        await handlePress()
        overlayWindow.show();
        await invoke("store_focused_window");
        overlayWindow.setFocus();
      } else if (event.state === "Released") {
        if (await overlayWindow.isVisible() && config.overlay.closeOnRelease) {
          handleClose()
        }
      }
    });

    if (stopKeybind) {
      setKeybind(stopKeybind)
      await register(stopKeybind, () => {
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

    websocket.on("init", (data) => {
      useWebsocket.setState({ data })
    })

    websocket.on("authenticated", ({ user }: { user: any, maxAge: number }) => {
      setStatus(SocketStatus.Connected)

      authStore.set("user", user)
    })

    websocket.on("init_categories", (categories) => {      
      if (appReady) return;

      store.setCategories(categories)
      appReady = true;
    })

    websocket.on("deprecated_set_categories", (categories) => {
      console.warn("Deprecated set_categories event received")

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
    const favoriteCategory = store.categories.find(category => category.name == "Favorite");

    if (favoriteCategory) {
      overlayWindow.emit("overlay_data", favoriteCategory.sounds || [])
    }

    registerAll()
  }, [store.categories, isOpen])

  useEffect(() => {
    if (initialized) return;

    initialized = true;

    websocket.connect()

    listen("sound_hovered", (event) => {
      hoveredSoundId.current = event.payload as string
    })

    listen("close_overlay", () => handleClose())

    hotkeys("ctrl+f", (event) => {
      event.preventDefault()

      showSearchBar()
    })

    loadConfig()
  }, [])

  const play = (sound: SoundEntry) => {
    websocket.emit("play_sound", sound.id, {
      volume: (sound.config?.volume / 100 || 1) * 0.75
    })
  }

  return (
    <AppContext.Provider value={{ keybind, setKeybind, volume, setVolume, selectedSound, setSelectedSound, sounds, setSounds, play }}>
      <ConfirmContextProvider>
        <div className='bg-white dark:bg-[#181818]'>
          <Toaster richColors />
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
  )
}

export default App
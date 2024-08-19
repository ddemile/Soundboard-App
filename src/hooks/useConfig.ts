import { appConfigDir } from "@tauri-apps/api/path";
import { BaseDirectory, exists, mkdir, writeFile } from "@tauri-apps/plugin-fs";
import { create } from "zustand";
import { CategoryData } from "../pages/Home.tsx";
import useLog from "./useLog.ts";

interface Config {
    /**
     * Old categories that were used in a previous version of the app.
     * @deprecated
     */
    categories: CategoryData[],
    stopKeybind: string;
    audio: {
        useSoundoardAppSounds: boolean,
        previewVolume: number,
        soundsVolume: number
    },
    migrated: boolean
}

interface ConfigStore {
    config: Config,
    loaded: boolean,
    getConfig: () => Config,
    setConfig: (config: object) => void,
    saveConfig: () => void,
    updateConfig: (config: Partial<Config>) => void,
    setLoaded: (loaded: boolean) => void
}

const defaultConfig = {
    categories: [],
    audio: {
        useSoundoardAppSounds: false,
        previewVolume: 100,
        soundsVolume: 100
    },
    stopKeybind: "",
    migrated: false
} satisfies Config

export default create<ConfigStore>()((set, get) => ({
    config: defaultConfig,
    loaded: false,
    getConfig: () => {
        return get().config
    },
    setConfig: (config) => {
        set({ config: config as Config })
    },
    saveConfig: () => {
        save(get().config)
    },
    updateConfig: (partialConfig) => {
        set({ config: { ...get().config, ...partialConfig } })
    },
    setLoaded: (loaded) => {
        set({ loaded })
    }
}))

async function save(config: object) {
    const log = useLog()

    let encoder = new TextEncoder();

    if (!(await exists("config.json", { baseDir: BaseDirectory.AppConfig }))) {
        if (!(await exists(await appConfigDir()))) await mkdir(await appConfigDir());

        await writeFile("config.json", encoder.encode("{}"), { baseDir: BaseDirectory.AppConfig })

        log("Config updated")
    }

    await writeFile("config.json", encoder.encode(JSON.stringify(config, null, 4)), { baseDir: BaseDirectory.AppConfig })

    log("Config updated")
}


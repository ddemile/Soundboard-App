import { BaseDirectory, createDir, exists, writeFile } from "@tauri-apps/api/fs";
import { appConfigDir } from "@tauri-apps/api/path";
import defaultsDeep from "lodash.defaultsdeep";
import { create } from "zustand";
import { CategoryData } from "../pages/Home.tsx";
import useLog from "./useLog.ts";

interface Config {
    categories: CategoryData[],
    stopKeybind: string;
    audio: {
        useSoundoardAppSounds: boolean,
        previewVolume: number,
        soundsVolume: number
    }
}

interface ConfigStore {
    config: Config,
    setConfig: (config: object) => void,
    saveConfig: () => void,
    updateConfig: (config: Partial<Config>) => void
}

const defaultConfig = {
    categories: [],
    audio: {
        useSoundoardAppSounds: false,
        previewVolume: 100,
        soundsVolume: 100
    },
    stopKeybind: ""
} satisfies Config

export default create<ConfigStore>()((set, get) => ({
    config: defaultConfig,
    setConfig: (config) => {
        set({ config: config as Config })
    },
    saveConfig: () => {
        save(get().config)
    },
    updateConfig: (partialConfig) => {
        set({ config: defaultsDeep(partialConfig, get().config) })
    }
}))

async function save(config: object) {
    const log = useLog()

    if (!(await exists("config.json", { dir: BaseDirectory.AppConfig }))) {
        if (!(await exists(await appConfigDir()))) await createDir(await appConfigDir());

        await writeFile("config.json", "{}", { dir: BaseDirectory.AppConfig })

        log("Config updated")
    }

    await writeFile("config.json", JSON.stringify(config, null, 4), { dir: BaseDirectory.AppConfig })

    log("Config updated")
}


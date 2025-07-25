import { appConfigDir } from "@tauri-apps/api/path";
import { BaseDirectory, exists, mkdir, readTextFile, writeFile } from "@tauri-apps/plugin-fs";
import { z } from "zod";
import { create } from "zustand";
import useLog from "./useLog.ts";

export const configSchema = z.object({
    categories: z.array(z.any()).catch([]),
    audio: z.object({
        useSoundoardAppSounds: z.boolean().catch(true),
        previewVolume: z.number().min(0).max(100).catch(100),
        soundsVolume: z.number().min(0).max(100).catch(100)
    }).default({}),
    overlay: z.object({
        teleportMouseToCenter: z.boolean().catch(false),
        closeOnRelease: z.boolean().catch(true)
    }).default({}),
    stopKeybind: z.string().catch("")
})

type Config = z.infer<typeof configSchema>

export const defaultConfig = configSchema.parse({})

interface ConfigStore {
    config: Config,
    loaded: boolean,
    getConfig: () => Config,
    saveConfig: () => void,
    loadConfig: () => void,
    updateConfig: (config: Partial<Config>) => void,
    setLoaded: (loaded: boolean) => void
}

export default create<ConfigStore>()((set, get) => ({
    config: defaultConfig,
    loaded: false,
    getConfig: () => {
        return get().config
    },
    saveConfig: () => {
        save(get().config)
    },
    loadConfig() {
        fetchConfig().then((config) => {
            set({ config, loaded: true })
        })
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

        await writeFile("config.json", encoder.encode(JSON.stringify(defaultConfig, null, 4)), { baseDir: BaseDirectory.AppConfig })

        log("Config updated")
    }

    await writeFile("config.json", encoder.encode(JSON.stringify(config, null, 4)), { baseDir: BaseDirectory.AppConfig })

    log("Config updated")
}

async function fetchConfig(): Promise<Config> {
    if (!(await exists("config.json", { baseDir: BaseDirectory.AppConfig }))) {
        if (!(await exists(await appConfigDir()))) await mkdir(await appConfigDir());

        let encoder = new TextEncoder();
        await writeFile("config.json", encoder.encode(JSON.stringify(defaultConfig, null, 4)), { baseDir: BaseDirectory.AppConfig })
    }

    try {
        const content = await readTextFile("config.json", {
            baseDir: BaseDirectory.AppConfig
        })

        const data = JSON.parse(content)
        
        const config = configSchema.parse(data)

        save(config)

        return config
    } catch (e) {
        console.log(e)

        let encoder = new TextEncoder();
        await writeFile("config.json", encoder.encode(JSON.stringify(defaultConfig, null, 4)), { baseDir: BaseDirectory.AppConfig })

        return defaultConfig
    }
}
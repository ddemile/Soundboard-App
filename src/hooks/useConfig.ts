import { BaseDirectory, createDir, exists, readTextFile, writeFile } from "@tauri-apps/api/fs";
import { appConfigDir } from "@tauri-apps/api/path";
import useLog from "./useLog.ts";

export default function useConfig() {
    const log = useLog()

    const getConfig = async () => {
        if (!(await exists("config.json", { dir: BaseDirectory.AppConfig }))) {
            if (!(await exists(await appConfigDir()))) await createDir(await appConfigDir());

            await writeFile("config.json", "{}", { dir: BaseDirectory.AppConfig })
        }

        try {
            return JSON.parse(await readTextFile("config.json", {
                dir: BaseDirectory.AppConfig
            }))
        } catch (e) {
            console.log(e)
            throw new Error("Invalid config")
        }

    }

    const saveConfig = async (config: object) => {
        if (!(await exists("config.json", { dir: BaseDirectory.AppConfig }))) {
            if (!(await exists(await appConfigDir()))) await createDir(await appConfigDir());

            await writeFile("config.json", "{}", { dir: BaseDirectory.AppConfig })

            log("Config updated")
        }

        await writeFile("config.json", JSON.stringify(config, null, 4), { dir: BaseDirectory.AppConfig })

        log("Config updated")
    }

    const updateConfig = async (props: object) => {
        const config = await getConfig()
        const newConfig = { ...config, ...props }
        await saveConfig(newConfig)
        return newConfig
    }

    return {
        config: getConfig,
        saveConfig,
        updateConfig
    }
}
import { readTextFile, BaseDirectory, exists, writeFile, createDir } from "@tauri-apps/api/fs";
import { appConfigDir } from "@tauri-apps/api/path";

export default function useConfig() {
    return {
        config: async () => {
            if (!(await exists("config.json", { dir: BaseDirectory.AppConfig }))) {
                if (!(await exists(await appConfigDir()))) await createDir(await appConfigDir());

                await writeFile("config.json", "{}", { dir: BaseDirectory.AppConfig })
            }

            return JSON.parse(await readTextFile("config.json", {
                dir: BaseDirectory.AppConfig
            }))
        },
        saveConfig: async (config: object) => {
            if (!(await exists("config.json", { dir: BaseDirectory.AppConfig }))) {
                if (!(await exists(await appConfigDir()))) await createDir(await appConfigDir());

                await writeFile("config.json", "{}", { dir: BaseDirectory.AppConfig })
            }

            await writeFile("config.json", JSON.stringify(config), { dir: BaseDirectory.AppConfig })
        }
    }
}
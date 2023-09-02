import { BaseDirectory, createDir, exists, readTextFile, writeFile } from "@tauri-apps/api/fs";
import { appConfigDir } from "@tauri-apps/api/path";

export default async function fetchConfig() {
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
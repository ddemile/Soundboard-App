import { appConfigDir } from "@tauri-apps/api/path";
import { BaseDirectory, exists, mkdir, readTextFile, writeFile } from "@tauri-apps/plugin-fs";

export default async function fetchConfig() {
    if (!(await exists("config.json", { baseDir: BaseDirectory.AppConfig }))) {
        if (!(await exists(await appConfigDir()))) await mkdir(await appConfigDir());

        let encoder = new TextEncoder();
        await writeFile("config.json", encoder.encode("{}"), { baseDir: BaseDirectory.AppConfig })
    }

    try {
        return JSON.parse(await readTextFile("config.json", {
            baseDir: BaseDirectory.AppConfig
        }))
    } catch (e) {
        console.log(e)
        throw new Error("Invalid config")
    }
}
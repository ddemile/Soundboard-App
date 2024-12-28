import { appConfigDir } from "@tauri-apps/api/path";
import { BaseDirectory, exists, mkdir, readTextFile, writeFile } from "@tauri-apps/plugin-fs";

export default async function fetchConfig() {
    if (!(await exists("config.json", { baseDir: BaseDirectory.AppConfig }))) {
        if (!(await exists(await appConfigDir()))) await mkdir(await appConfigDir());

        let encoder = new TextEncoder();
        await writeFile("config.json", encoder.encode("{}"), { baseDir: BaseDirectory.AppConfig })
    }

    try {
        // TODO: Fix this function because there is a bug in tauri where  the readTextFile returns an arraybuffer instead of a string
        const buffer = await readTextFile("config.json", {
            baseDir: BaseDirectory.AppConfig
        }) as any as ArrayBuffer

        const decoder = new TextDecoder();

        const string = decoder.decode(buffer)

        return JSON.parse(string)
    } catch (e) {
        console.log(e)
        throw new Error("Invalid config")
    }
}
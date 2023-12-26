import { BaseDirectory, readBinaryFile } from "@tauri-apps/api/fs";
import { Socket } from "socket.io-client";
import useLog from "../hooks/useLog.ts";
import { CategoryData, SoundEntry } from "../pages/Home.tsx";

export type ProgressEvent = {
    progress: number,
    soundsUploaded: number,
    totalSounds: number,
    currentlyUploading: number,
    uploadsFailed: number,
    finished: boolean
}

export async function uploadSounds(categories: CategoryData[], socket: Socket, progress: (event: ProgressEvent) => void) {
    const log = useLog()

    await socket.emitWithAck("sync_categories_wait", categories.map(category => ({
        ...category,
        sounds: []
    })))

    const sounds = categories.reduce((accumulator: SoundEntry[], category) => {
        const sounds = [];
        for (let sound of category.sounds) {
            sound.category = category.name;
            sounds.push(sound);
        }
        return [...accumulator, ...sounds]
    }, [])

    let index = 0;
    let soundsUploaded = 0;
    let uploadsFailed = 0;
    for await (let sound of sounds) {
        index++;
        
        log(`Uploading sound ${index}/${sounds.length}`)

        progress({ soundsUploaded, totalSounds: sounds.length, progress: soundsUploaded / sounds.length * 100, currentlyUploading: index, uploadsFailed, finished: false })

        const content = await readBinaryFile(sound.file, { dir: BaseDirectory.AppCache })

        const response = await socket.emitWithAck("uploadSound", { title: (sound as any).name, ...(sound as any) }, content)

        if (response != "File cached") {
            uploadsFailed ++;
            log(`Unable to upload ${sound.title}: ${response}`)
        } else {
            soundsUploaded ++;
        }

        progress({ soundsUploaded, totalSounds: sounds.length, progress: soundsUploaded / sounds.length * 100, currentlyUploading: index, uploadsFailed, finished: false })
    }

    progress({ soundsUploaded, totalSounds: sounds.length, progress: soundsUploaded / sounds.length * 100, currentlyUploading: index, uploadsFailed, finished: true })

    log(`Uploaded ${soundsUploaded} out of ${sounds.length} sounds`)
}
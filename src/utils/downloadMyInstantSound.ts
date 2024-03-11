import axios, { AxiosProgressEvent } from "axios";

export default async function downloadMyInstantSound(instant: any, onProgress?: (progressEvent: AxiosProgressEvent) => void) {
    const { data: sound } = await axios.get(`https://ddemile.nano3.fr:4444/my-instants/download?downloadUrl=${encodeURIComponent(instant.downloadUrl)}`, {
        responseType: "arraybuffer",
        onDownloadProgress(progressEvent) {
            if (onProgress) onProgress(progressEvent)
        }
    })

    return sound
}
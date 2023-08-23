import axios, { AxiosProgressEvent, ResponseType } from "axios";

function proxy(url: string, responseType: ResponseType = "text") {
    return `https://ddemile.nano3.fr:4004?url=${url}&responseType=${responseType}`
}

export default async function downloadMyInstantSound(instant: any, onProgress?: (progressEvent: AxiosProgressEvent) => void) {
    const sound = await axios.get(proxy(instant.downloadUrl, "arraybuffer"), {
        responseType: "arraybuffer",
        onDownloadProgress(progressEvent) {
            if (onProgress) onProgress(progressEvent)
        },
    })

    return sound.data
}
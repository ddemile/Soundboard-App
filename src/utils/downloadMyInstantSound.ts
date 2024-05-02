import axios, { AxiosProgressEvent } from "axios";
import { BASE_API_URL } from "./constants.ts";

export default async function downloadMyInstantSound(instant: any, onProgress?: (progressEvent: AxiosProgressEvent) => void) {
    const { data: sound } = await axios.get(`${BASE_API_URL}/my-instants/download?downloadUrl=${encodeURIComponent(instant.downloadUrl)}`, {
        responseType: "arraybuffer",
        onDownloadProgress(progressEvent) {
            if (onProgress) onProgress(progressEvent)
        }
    })

    return sound
}
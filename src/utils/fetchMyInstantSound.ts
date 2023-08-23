import axios, { AxiosProgressEvent, ResponseType } from "axios";
import { load } from "cheerio"
import { basename } from "@tauri-apps/api/path"

function proxy(url: string, responseType: ResponseType = "text") {
    return `https://ddemile.nano3.fr:4004?url=${url}&responseType=${responseType}`
}

export default async function fetchMyInstantSound(url: string, onProgress?: (progressEvent: AxiosProgressEvent) => void) {
    const { data } = await axios.get(proxy(url))

    let $ = load(data)

    const button = $(".large-button")
    const title = $("#instant-page-title").text()

    const inputString = button.attr("onclick");

    if (!inputString) return null

    const regex = /play\('([^']+)'/;
    const match = inputString.match(regex);

    let relativePath;
    if (match && match.length >= 2) {
        relativePath = match[1];
    }

    if (!relativePath) return null;

    const sound = await axios.get(proxy(`https://www.myinstants.com/${relativePath}`, "arraybuffer"), {
        responseType: "arraybuffer",
        onDownloadProgress(progressEvent) {
            if (onProgress) onProgress(progressEvent)
        },
    })

    return {
        data: sound.data,
        title,
        fileName: await basename(relativePath),
        url,
        downloadUrl: `https://www.myinstants.com/${relativePath}`
    }
}
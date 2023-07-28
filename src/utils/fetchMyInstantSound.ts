import axios from "axios";
import { load } from "cheerio"
import { basename } from "@tauri-apps/api/path"

export default async function fetchMyInstantSound(url: string) {
    const { data } = await axios.get(`http://localhost:3000?url=${url}`)

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

    const sound = await axios.get(`http://localhost:3000?responseType=arraybuffer&url=https://www.myinstants.com${relativePath}`, { responseType: "arraybuffer" })

    return {
        data: sound.data,
        title,
        fileName: await basename(relativePath)
    }
}
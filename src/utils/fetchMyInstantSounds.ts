import axios, { ResponseType } from "axios";
import { load } from "cheerio"
import { basename } from "@tauri-apps/api/path";

function proxy(url: string, responseType: ResponseType = "text") {
    return `https://ddemile.nano3.fr:4004?url=${url}&responseType=${responseType}`
}

function fetchStyle(style: string): Record<string, string> {
    const regex = /([^:]+):\s*([^;]+);/g;
    
    let resultObject: any = {};
    let matches;
    
    while ((matches = regex.exec(style)) !== null) {
      if (matches.length === 3) {
        const propertyName = matches[1].trim();
        const propertyValue = matches[2].trim();
        const jsPropertyName = propertyName.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
        resultObject[jsPropertyName] = propertyValue;
      }
    }
    
    return resultObject
}

export default async function fetchMyInstantSounds(search?: string) {
    const url = proxy(search ? `https://www.myinstants.com/search?name=${search}` : "https://www.myinstants.com/")

    const { data } = await axios.get(url)

    let $ = load(data)

    return (await Promise.allSettled($(".instant").toArray().map(async instant => {
        const title = $(instant).children("a").text()

        const { backgroundColor: color } = fetchStyle($(instant).children(".small-button-background").attr("style")!)

        console.log(color, "color")

        const inputString = $(instant).children(".small-button").attr("onclick");

        if (!inputString) return

        const regex = /(?<=play\()'([^']+)'+(?:\s*,\s*'([^']+)'+)*/;
        const match = inputString.match(regex);

        let relativePath;
        let id;
        if (match && match.length >= 3) {
            relativePath = match[1];
            id = match[2];
        }

        if (!relativePath || !id) return

        return {
            title,
            url: `https://www.myinstants.com/instant/${id}`,
            downloadUrl: `https://www.myinstants.com${relativePath}`,
            fileName: await basename(`https://www.myinstants.com${relativePath}`),
            color
        }
    }))).filter(promise => promise.status == "fulfilled").map(promise => (promise as any).value)
}
import { create } from "zustand";

interface AudioPlayerStore {
    ressources: Record<string, HTMLAudioElement>
    play: ({ id, volume, url }: { id: string, volume?: number, url: string }) => void,
    pause: ({ id }: { id: string }) => void;
    stop: ({ id }: { id: string }) => void;
}

export default create<AudioPlayerStore>()((set, get) => ({
    ressources: {},
    play({ id, url, volume = 100 }) {
        const { ressources } = get()

        const ressource = ressources[id] ?? new Audio(url)

        ressource.play()

        ressource.volume = volume / 100

        set({ ressources: { ...ressources, [id]: ressource } })
    },
    pause({ id }) {
        const { ressources } = get()

        const ressource = ressources[id]

        if (ressource.paused) {
            ressource.play()
        } else {
            ressource.pause()
        }

        set({ ressources: { ...ressources, [id]: ressource } })
    },
    stop({ id }) {
        const { ressources } = get()

        delete ressources[id]

        set({ ressources })
    },
}))
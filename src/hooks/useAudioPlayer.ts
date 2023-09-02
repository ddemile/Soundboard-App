import { create } from "zustand";

interface AudioPlayerStore {
    ressources: Record<string, HTMLAudioElement>
    play: ({ id, volume, url }: { id: string, volume?: number, url: string }) => void,
    pause: ({ id }: { id: string }) => void;
    stop: (props?: { id: string }) => void;
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
    stop(props) {
        if (!props) {
            Object.values(get().ressources).forEach((ressource) => {
                ressource.pause()
                ressource.currentTime = 0
            })

            set({ ressources: {} })
        } else {
            const { ressources } = get()

            ressources[props.id].currentTime = 0
            ressources[props.id].pause()

            delete ressources[props.id]

            set({ ressources })
        }
    },
}))
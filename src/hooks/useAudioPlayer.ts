import { toast } from "sonner";
import { create } from "zustand";

interface AudioPlayerStore {
    ressources: Record<string, HTMLAudioElement>
    play: ({ id, volume, url }: { id: string, volume?: number, url: string }) => void,
    pause: ({ id }: { id: string }) => void;
    stop: (props?: { id: string }) => void;
    globalSetVolume: (selector: (ressource: [title: string, audio: HTMLAudioElement]) => boolean, volume: number) => void;
}

export default create<AudioPlayerStore>()((set, get) => ({
    ressources: {},
    play({ id, url, volume = 100 }) {
        const { ressources } = get()

        const ressource = ressources[id] ?? new Audio(url)

        ressource.play().catch((error) => {
            console.error(error)
            toast.error(`Failed to play audio: ${id}`)
        })

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
    globalSetVolume(selector, volume) {
        const ressources = Object.entries(get().ressources)
        const selectedRessources = [];
        
        for (let ressource of ressources) {
            if (selector(ressource)) {
                selectedRessources.push(ressource)
            }
        }
        
        for (let ressource of selectedRessources) {
            const [_, audio] = ressource;
            audio.volume = volume / 100;
        }    
    }
}))
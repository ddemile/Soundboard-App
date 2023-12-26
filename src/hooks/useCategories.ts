import { create } from "zustand";
import { CategoryData, SoundEntry } from "../pages/Home.tsx";
import { socket } from "./useWebsocket.ts";

interface CategoryStore {
    categories: CategoryData[],
    setCategories: (categories: CategoryData[]) => void
    createCategory: (category: CategoryData) => void
    updateCategory: (name: string, newProps: Partial<CategoryData>) => void
    deleteCategory: (categoryName: string) => void
    addSound: (sound: SoundEntry, categoryName: string) => void
    removeSound: (soundName: string, categoryName: string) => void
    updateSound: (soundFile: string, categoryName: string, newProps: Partial<SoundEntry>) => void,
    deleteSound: (soundId: string) => void,
    saveCategories: () => void
}

export default create<CategoryStore>()((set, get) => ({
    categories: [],
    setCategories: (categories) => {
        set({ categories })
    },
    createCategory: (category) => {
        set({ categories: [ ...get().categories, category ] })
    },
    updateCategory: (name, newProps) => {
        const categories = structuredClone(get().categories)
        const categoryIndex = categories.findIndex(category => category.name == name)
        categories[categoryIndex] = { ...categories[categoryIndex], ...newProps }

        if (typeof categoryIndex == "number") {
            set({ categories })
        }
    },
    deleteCategory: (categoryName) => {
        const categories = structuredClone(get().categories.filter(category => category.name != categoryName))

        set({ categories })
    },
    addSound: (sound, categoryName) => {
        const { categories, updateCategory } = get();

        const category = structuredClone(categories.find(category => category.name == categoryName))

        if (category) {
            category.sounds.push(sound)
            updateCategory(category.name, { sounds: category.sounds })
        }
    },
    removeSound: (soundName, categoryName) => {
        const { categories, updateCategory } = get()

        const category = structuredClone(categories.find(category => category.name == categoryName))

        if (category) {
            const sounds = category.sounds.filter(sound => sound.title != soundName)
            updateCategory(category.name, { sounds })
        }
    },
    updateSound: (soundId: string, categoryName: string, newProps: Partial<SoundEntry>) => {
        const { categories, updateCategory } = get()

        const category = structuredClone(categories.find(category => category.name == categoryName))

        if (category) {
            const soundIndex = category.sounds.findIndex(sound => sound.id == soundId)
            const sounds = category.sounds
            sounds[soundIndex] = { ...sounds[soundIndex], ...newProps }

            updateCategory(category.name, { sounds: category.sounds })

            socket.emit("update_sound", soundId, newProps)
        }
    },
    deleteSound: (soundId) => {
        socket.emit("delete_sound", soundId)
    },
    saveCategories: () => {
        const { categories } = get()

        socket.emit("sync_categories", categories)
    }
}))
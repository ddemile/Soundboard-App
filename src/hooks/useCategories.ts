import { create } from "zustand";
import { CategoryData, SoundEntry } from "../pages/Home.tsx";
import { socket } from "./useWebsocket.ts";

interface CategoryStore {
    categories: CategoryData[],
    getCategories: () => CategoryData[],
    setCategories: (categories: CategoryData[]) => void
    createCategory: (category: CategoryData) => void
    updateCategory: (name: string, newProps: Partial<CategoryData>) => void
    deleteCategory: (categoryName: string) => void
    addSound: (sound: SoundEntry, categoryName: string) => void
    removeSound: (soundId: string, categoryName: string) => void
    updateSound: (soundFile: string, categoryName: string, newProps: Partial<SoundEntry>) => void,
    deleteSound: (soundId: string) => void,
    moveSound: (soundId: string, categoryName: string) => void,
}

export const useCategoriesStore = create<CategoryStore>()((set, get) => ({
    categories: [],
    getCategories: () => get().categories,
    setCategories: (categories) => {
        set({ categories })
    },
    createCategory: (category) => {
        const { categories } = get();
        
        if (categories.find(({ name }) => name == category.name)) return;

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
            if (category.sounds.find(({ id }) => id == sound.id)) return;

            category.sounds.push(sound)
            updateCategory(category.name, { sounds: category.sounds })
        }
    },
    removeSound: (soundId, categoryName) => {
        const { categories, updateCategory } = get()

        const category = structuredClone(categories.find(category => category.name == categoryName))

        if (category) {
            const sounds = category.sounds.filter(sound => sound.id != soundId)
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
        }
    },
    deleteSound: (soundId) => {
        const { categories, removeSound } = get()

        const sounds = categories.reduce<SoundEntry[]>((accumulator, category) => [ ...accumulator, ...category.sounds.map(sound => ({ ...sound, category: category.name })) ], [])

        const sound = sounds.find(sound => sound.id == soundId)
        
        if (sound) {
            removeSound(sound.id, sound.category!)
        }
    },
    moveSound(soundId, categoryName) {
        const { categories, removeSound, addSound } = get()

        const category = categories.find(({ sounds }) => sounds.some(sound => sound.id == soundId))

        if (category) {
          const sound = category.sounds.find(sound => sound.id == soundId)!
          removeSound(soundId, category.name)
          addSound(sound, categoryName)
        }
    },
}))

export default function useCategories() {
    const store = useCategoriesStore();

    return {
        categories: store.categories,
        getCategories() {
            return store.getCategories();
        },
        createCategory(category) {
            store.createCategory(category)
            socket.emit("create_category", category)
        },
        updateCategory(name, newProps) {
            store.updateCategory(name, newProps)
            socket.emit("update_category", name, newProps)
        },
        deleteCategory(categoryName) {
            store.deleteCategory(categoryName)
            socket.emit("delete_category", categoryName)
        },
        updateSound(soundId, categoryName, newProps) {
            store.updateSound(soundId, categoryName, newProps)
            socket.emit("update_sound", soundId, newProps)
        },
        deleteSound(soundId) {
            store.deleteSound(soundId);
            socket.emit("delete_sound", soundId)
        },
        moveSound(soundId, categoryName) {
            store.moveSound(soundId, categoryName)
            socket.emit("move_sound", soundId, categoryName)
            console.log("Emit move sound")
        }
    } satisfies Partial<CategoryStore>
}
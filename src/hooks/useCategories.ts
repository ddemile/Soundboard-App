import { create } from "zustand";
import { CategoryData, SoundEntry } from "../pages/Home.tsx";
import useConfig from "./useConfig.ts";

interface CategoriesState {
    categories: CategoryData[];
    setCategories: (categories: CategoryData[]) => void,
    updateCategory: (name: string, newProps: Partial<CategoryData>) => void,
    createCategory: (category: CategoryData) => void,
    deleteCategory: (categoryName: string) => void,
    addSound: (sound: SoundEntry, categoryName: string) => void,
    removeSound: (soundName: string, categoryName: string) => void,
    updateSound: (soundFile: string, categoryName: string, newProps: Partial<SoundEntry>) => void,
    save: () => Promise<void>
}

export default create<CategoriesState>()((set, get) => ({
    categories: [], 
    setCategories: (categories) => set({ categories }),
    updateCategory: (name, newProps) => {
        const categories = structuredClone(get().categories)
        const categoryIndex = categories.findIndex(category => category.name == name)
        categories[categoryIndex] = { ...categories[categoryIndex], ...newProps }

        if (typeof categoryIndex == "number") {
            set({ categories })
        }
    },
    createCategory: (category) => {
        set({ categories: [...get().categories, category] })
    },
    deleteCategory: (categoryName) => {
        const categories = structuredClone(get().categories.filter(category => category.name != categoryName))

        set({ categories })
    },
    addSound: (sound, categoryName) => {
        const { categories, updateCategory } = get()

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
            category.sounds = category.sounds.filter(sound => sound.name != soundName)
            updateCategory(category.name, { sounds: category.sounds })
        }
    },
    updateSound: (soundFile, categoryName, newProps) => {
        const { categories, updateCategory } = get()

        const category = structuredClone(categories.find(category => category.name == categoryName))

        if (category) {
            console.log(`Update sound: ${soundFile} ${categoryName} ${newProps}`)
            console.log(newProps)

            const soundIndex = category.sounds.findIndex(sound => sound.file == soundFile)
            const sounds = category.sounds
            sounds[soundIndex] = { ...sounds[soundIndex], ...newProps }

            console.log(sounds)

            updateCategory(category.name, { sounds: category.sounds })
        }
    },
    save: async () => {
        const { config: getConfig, saveConfig } = useConfig()
        const config = await getConfig()
        config.categories = get().categories
        await saveConfig(config)
    }
}))
import { CategoryData, SoundEntry } from "../pages/Home.tsx";
import useConfig from "./useConfig.ts";

export default function useCategories() {
    const { config, updateConfig, setConfig } = useConfig()

    const createCategory = (category: CategoryData) => {
        updateConfig({ categories: [...config.categories, category] })
    }

    const updateCategory = (name: string, newProps: Partial<CategoryData>) => {
        const categories = structuredClone(config.categories)
        const categoryIndex = categories.findIndex(category => category.name == name)
        categories[categoryIndex] = { ...categories[categoryIndex], ...newProps }

        if (typeof categoryIndex == "number") {
            updateConfig({ categories })
        }
    }

    const deleteCategory = (categoryName: string) => {
        const categories = structuredClone(config.categories.filter(category => category.name != categoryName))

        setConfig({ ...config, categories })
    }

    const addSound = (sound: SoundEntry, categoryName: string) => {
        const { categories } = config;

        const category = structuredClone(categories.find(category => category.name == categoryName))

        if (category) {
            category.sounds.push(sound)
            updateCategory(category.name, { sounds: category.sounds })
        }
    }

    const removeSound = (soundName: string, categoryName: string) => {
        const { categories } = config

        const category = structuredClone(categories.find(category => category.name == categoryName))

        if (category) {
            category.sounds = category.sounds.filter(sound => sound.name != soundName)
            updateCategory(category.name, { sounds: category.sounds })
        }
    }

    const updateSound = (soundFile: string, categoryName: string, newProps: Partial<SoundEntry>) => {
        const { categories } = config

        const category = structuredClone(categories.find(category => category.name == categoryName))

        if (category) {
            const soundIndex = category.sounds.findIndex(sound => sound.file == soundFile)
            const sounds = category.sounds
            sounds[soundIndex] = { ...sounds[soundIndex], ...newProps }

            updateCategory(category.name, { sounds: category.sounds })
        }
    }

    return {
        categories: config.categories,
        createCategory,
        deleteCategory,
        updateCategory,
        addSound,
        removeSound,
        updateSound
    }
}
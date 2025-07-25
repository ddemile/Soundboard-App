import type { SoundEntry } from "@/pages/Home.tsx";
import { create } from "zustand";

interface OverlayStore {
    sounds: SoundEntry[]
}

export default create<OverlayStore>()(() => ({
    sounds: []
}))
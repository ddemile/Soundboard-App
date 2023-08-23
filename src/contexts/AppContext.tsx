import { createContext, Dispatch, SetStateAction } from 'react';
import { SoundEntry } from '../pages/Home.tsx';

const AppContext = createContext<{
    keybind: string | undefined,
    setKeybind: Dispatch<SetStateAction<string | undefined>>,
    volume: number | undefined,
    setVolume: Dispatch<SetStateAction<number | undefined>>,
    selectedSound: string | null,
    setSelectedSound: Dispatch<SetStateAction<string | null>>,
    sounds: SoundEntry[] | undefined,
    setSounds: Dispatch<SetStateAction<SoundEntry[]>>,
    play: (sound: SoundEntry) => void
} | null>(null);

export default AppContext;
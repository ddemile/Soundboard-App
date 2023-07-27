import { createContext, Dispatch, SetStateAction } from 'react';
import { SoundEntry } from '../App.tsx';

const AppContext = createContext<{
    keybind: string | undefined,
    setKeybind: Dispatch<SetStateAction<string | undefined>>,
    volume: number | undefined,
    setVolume: Dispatch<SetStateAction<number | undefined>>,
    selectedSound: string | null,
    sounds: SoundEntry[] | undefined,
    setSounds: Dispatch<SetStateAction<SoundEntry[]>>
} | null>(null);

export default AppContext;
import { useEffect, Dispatch, SetStateAction, useContext, ChangeEvent, useState, useRef, ElementRef } from "react";
import { removeFile, BaseDirectory } from '@tauri-apps/api/fs';
import AppContext from "../contexts/AppContext.tsx";
import useConfig from "../hooks/useConfig.ts";
import Modal from "./Modal.tsx";

export default function ConfigModal({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
    const { keybind, setKeybind, volume, setVolume, selectedSound, sounds, setSounds } = useContext(AppContext)!
    const { config: getConfig, saveConfig } = useConfig()
    const [config, setConfig] = useState<any>({})
    const nameRef = useRef<ElementRef<"h3">>(null)
    const [name, setName] = useState("")
    
    useEffect(() => {
        getConfig().then((config) => {
            setConfig(config)
        })
    }, [])

    useEffect(() => {
        if (open) {
            nameRef.current?.blur()
            if (selectedSound) {
                setName(config?.sounds[selectedSound]?.name)
            }
        }
    }, [open])

    useEffect(() => {
        getConfig().then((config) => {
            setConfig(config)
        })
    }, [sounds])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        if (setKeybind && name == "keybind") setKeybind(value)
        if (setVolume && name == "volume") setVolume(Number(value))
    }

    const handleClose = () => {
        if (selectedSound) {
            const sound = config?.sounds[selectedSound]
            const newConfig = { ...config }
            console.log(name)
            console.log(!!sound, sound)
            if (sound) {
                sound.name = name;
                console.log(sound.file)
                newConfig.sounds[sound.file] = sound;
                console.log(newConfig.sounds[sound.file])
                console.log(newConfig.sounds)
                saveConfig(newConfig)
                setSounds(newConfig.sounds)
            }
        }
    }

    return <Modal open={open} setOpen={setOpen} onClose={handleClose}>
        {selectedSound && config && <h3 ref={nameRef} spellCheck={false} onInput={(e) => setName(e.currentTarget.textContent ?? "")} contentEditable className="text-xl font-semibold">{name}</h3>}
        {selectedSound && config && <h4 className="text-sm">{config.sounds[selectedSound]?.file}</h4>}
        <div className="flex gap-2.5 flex-col">
            <div className="flex flex-col">
                <label className="text-left">Keybind</label>
                <input type="text" name="keybind" className="p-1 rounded-sm border-2 border-[#3a3a3a]" value={keybind || ""} onChange={handleChange} />
            </div>
            <div className="flex flex-col">
                <label className="text-left">Volume ({volume ?? 100}%)</label>
                <input className="border-2 border-[#3a3a3a] rounded-sm" type="range" max={200} min={0} name="volume" value={volume ?? 100} onChange={handleChange} />
            </div>
            {selectedSound && config && <>
                <div className="option-container flex flex-col">
                    <button onClick={() => {
                        setOpen(false)
                        removeFile(config.sounds[selectedSound].file, {
                            dir: BaseDirectory.AppCache
                        })
                    
                        console.log(config.sounds[selectedSound])

                        delete config.sounds[selectedSound]

                        console.log(config.sounds)

                        setSounds(Object.values(config.sounds))
                        saveConfig(config)
                    }}>Delete</button>
                </div>
            </>}
        </div>
    </Modal>
}
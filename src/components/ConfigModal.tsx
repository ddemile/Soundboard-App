import { useEffect, Dispatch, SetStateAction, useContext, ChangeEvent, useState, useRef, ElementRef } from "react";
import { removeFile, BaseDirectory } from '@tauri-apps/api/fs';
import { register, unregister } from '@tauri-apps/api/globalShortcut';
import AppContext from "../contexts/AppContext.tsx";
import useConfig from "../hooks/useConfig.ts";
import Modal from "./Modal.tsx";
import useLog from "../hooks/useLog.ts";

export default function ConfigModal({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
    const { keybind, setKeybind, volume, setVolume, selectedSound, setSelectedSound, sounds, setSounds, play } = useContext(AppContext)!
    const { config: getConfig, saveConfig } = useConfig()
    const [config, setConfig] = useState<any>({})
    const nameRef = useRef<ElementRef<"h3">>(null)
    const [name, setName] = useState("")
    const log = useLog()

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
        if (selectedSound && selectedSound in config?.sounds) {
            const oldSound = config?.sounds[selectedSound]
            const newConfig = structuredClone(config)
            const newSound = newConfig?.sounds[selectedSound]

            if (newSound && oldSound) {
                newSound.name = name;
                newSound.keybind = keybind;
                newConfig.sounds[newSound.file] = newSound;

                if (oldSound.name != newSound.name) log(`${newSound.file}: ${oldSound?.name} > ${newSound.name}`)

                if (oldSound.keybind != newSound.keybind) {
                    if (oldSound.keybind) {
                        unregister(oldSound.keybind).then(() => {
                            if (newSound.keybind) {
                                register(newSound.keybind, () => play(newSound))
                            }
                        })
                    } else if (newSound.keybind) {
                        register(newSound.keybind, () => play(newSound))
                    }
                }

                if (oldSound.keybind != newSound.keybind || oldSound.name != newSound.name) {
                    setSelectedSound(null)
                    saveConfig(newConfig)
                    setConfig(newConfig)
                    setSounds(Object.values(newConfig.sounds))
                }
            }
        }
    }

    return <Modal open={open} setOpen={setOpen} onClose={handleClose} onOpen={() => { getConfig().then(config => setConfig(config)) }}>
        {selectedSound && config && <h3
            className="text-xl font-semibold"
            onChange={(e) => setName(e.currentTarget.textContent ?? "")}
            onBlur={(e) => setName(e.currentTarget.textContent ?? "")}
            ref={nameRef}
            contentEditable
            spellCheck={false}
            itemType="h3"
            dangerouslySetInnerHTML={{ __html: name }}
        />}
        {selectedSound && config && config.sounds[selectedSound] && <h4 className="text-sm">{config.sounds[selectedSound]?.file}</h4>}
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
                <div className="flex flex-col">
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
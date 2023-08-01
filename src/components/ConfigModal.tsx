import { useEffect, Dispatch, SetStateAction, useContext, ChangeEvent, useState, useRef, ElementRef } from "react";
import { removeFile, BaseDirectory } from '@tauri-apps/api/fs';
import { register, unregister } from '@tauri-apps/api/globalShortcut';
import AppContext from "../contexts/AppContext.tsx";
import useConfig from "../hooks/useConfig.ts";
import { AiOutlineClose } from "react-icons/ai"
import Modal from "./Modal.tsx";
import useLog from "../hooks/useLog.ts";

export default function ConfigModal({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
    const { volume, setVolume, selectedSound, setSelectedSound, sounds, setSounds, play } = useContext(AppContext)!
    const { config: getConfig, saveConfig } = useConfig()
    const [config, setConfig] = useState<any>({})
    const nameRef = useRef<ElementRef<"h3">>(null)
    const [name, setName] = useState("")
    const [recordingKeys, setRecordingKeys] = useState<boolean>(false)
    const [savedKeys, setSavedKeys] = useState<string[]>([])
    const [keys, setKeys] = useState<string[]>([])
    const log = useLog()

    useEffect(() => {
        getConfig().then((config) => {
            setConfig(config)
            setSavedKeys([])
            if (selectedSound && config?.sounds[selectedSound]?.keybind) {
                setSavedKeys(selectedSound && config?.sounds[selectedSound]?.keybind?.split("+"))
            }
        })
    }, [open])

    useEffect(() => {
        const current = new Set<string>()
        
        console.log("Hello")

        function onKeyPress(event: KeyboardEvent) {
            if (!current) return;

            const key = (event.key || event.code).toUpperCase();
            current.add(key);

            if (timeout) {
                clearTimeout(timeout)
                timeout = null;
            }

            setKeys(Array.from(current))
        }

        let timeout: NodeJS.Timeout | null = null;
        let keybind: string[] = []

        function onKeyRelease(event: KeyboardEvent) {
            if (!current) return;

            const key = (event.key || event.code).toUpperCase();

            if (!timeout) {
                keybind = Array.from(current)
                timeout = setTimeout(() => {
                    if (current.size == 0) {
                        timeout = null;
                        if (recordingKeys)
                        setSavedKeys(keybind)
                        setRecordingKeys(false)
                    }
                }, 200)
            }

            current.delete(key);

            setKeys(Array.from(current))    
        }
 
        // Add key event listeners
        document.addEventListener("keydown", onKeyPress);
        document.addEventListener("keyup", onKeyRelease);

        return () => {
            document.removeEventListener("keydown", onKeyPress)
            document.removeEventListener("keyup", onKeyRelease);
        }
    }, [recordingKeys])

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

        if (setVolume && name == "volume") setVolume(Number(value))
    }

    const handleClose = () => {
        if (selectedSound && selectedSound in config?.sounds) {
            const oldSound = config?.sounds[selectedSound]
            const newConfig = structuredClone(config)
            const newSound = newConfig?.sounds[selectedSound]

            if (newSound && oldSound) {
                newSound.name = name;
                newSound.keybind = savedKeys.join("+");

                if (oldSound.config?.volume != volume) {
                    newSound.config ??= {}
                    newSound.config.volume = volume
                }

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

                if (oldSound.keybind != newSound.keybind || oldSound.name != newSound.name || oldSound.config?.volume != newSound.config?.volume) {
                    setSelectedSound(null)
                    saveConfig(newConfig)
                    setConfig(newConfig)
                    setSounds(Object.values(newConfig.sounds))
                }
            }
        }
    }

    const handleClick = () => {
        setRecordingKeys(!recordingKeys)
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
        {selectedSound && config?.sounds && selectedSound in config.sounds && <h4 className="text-sm">{config.sounds[selectedSound]?.file}</h4>}
        <div className="flex gap-2.5 flex-col">
            <div className="flex flex-col">
                <label className="text-left">Keybind</label>
                <p style={{ border: `1px solid ${recordingKeys ? "red" : "black"}` }} className="flex items-center gap-1 rounded-sm bg-zinc-800 p-1 h-8" onClick={handleClick}>{(recordingKeys ? keys : savedKeys).join("+")} <button onClick={(e ) => { e.stopPropagation(); setSavedKeys([]); setRecordingKeys(false) }} className="ml-auto p-0"><AiOutlineClose /></button></p>
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
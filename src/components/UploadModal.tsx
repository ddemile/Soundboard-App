import { Dispatch, MouseEventHandler, SetStateAction, useContext, useEffect, useState } from 'react'
import Modal from './Modal.tsx'
import useConfig from '../hooks/useConfig.ts'
import fetchMyInstantSound from '../utils/fetchMyInstantSound.ts'
import { BaseDirectory, writeBinaryFile } from '@tauri-apps/api/fs'
import { toast } from 'react-toastify'
import AppContext from '../contexts/AppContext.tsx'
import useLog from '../hooks/useLog.ts'

export default function UploadModal({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
    const { setSounds } = useContext(AppContext)!
    const [link, setLink] = useState<string>("")
    const { config: getConfig, saveConfig } = useConfig()
    const [_config, setConfig] = useState<any>();
    const log = useLog()

    useEffect(() => {
        getConfig().then(config => {
            setConfig(config);
        })
    }, [])

    const handleUpload: MouseEventHandler<HTMLButtonElement> = async () => {
        const sound = await fetchMyInstantSound(link)
        if (sound) {
            const { data, fileName, title } = sound;

            const newConfig = await getConfig()

            newConfig.sounds ??= {}
            if (fileName in newConfig.sounds) return toast(`${fileName} is already in the soundboard`, { type: "error" })

            if (data instanceof ArrayBuffer) {
                await writeBinaryFile(fileName, data, { dir: BaseDirectory.AppCache })

                const sound = {
                    name: title,
                    file: fileName,
                    keybind: ""
                }

                newConfig.sounds[fileName] = sound;
                log(`${sound.name} uploaded`)
                toast(`${sound.name} uploaded`, { type: "success" })
                setOpen(false)
            }

            setSounds(Object.values(newConfig.sounds))
            saveConfig(newConfig)
        }
    }

    return (
        <Modal open={open} setOpen={setOpen}>
            <h3 className="text-xl font-semibold">Upload a sound</h3>
            <div className="flex gap-2.5 flex-col">
                <div className="flex flex-col">
                    <label className="text-left">Sound link</label>
                    <input type="text" name="keybind" className="p-1 rounded-sm border-2 border-[#3a3a3a]" value={link} onChange={(e) => setLink(e.target.value)} />
                    <button onClick={handleUpload}>Upload</button>
                </div>
            </div>
        </Modal >
    )
}

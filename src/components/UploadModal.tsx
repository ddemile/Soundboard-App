import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import Modal from './Modal.tsx'
import useConfig from '../hooks/useConfig.ts'
import fetchMyInstantSound from '../utils/fetchMyInstantSound.ts'
import { BaseDirectory, writeBinaryFile } from '@tauri-apps/api/fs'
import { toast } from 'react-toastify'
import AppContext from '../contexts/AppContext.tsx'
import useLog from '../hooks/useLog.ts'
import { TbDragDrop } from 'react-icons/tb'

export default function UploadModal({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
    const { setSounds } = useContext(AppContext)!
    const [link, setLink] = useState<string>("")
    const { config: getConfig, saveConfig } = useConfig()
    const [_config, setConfig] = useState<any>();
    const log = useLog()
    const [soundData, setSoundData] = useState<any>()

    useEffect(() => {
        getConfig().then(config => {
            setConfig(config);
        })
    }, [])

    const handleUpload = async (forceFetch: boolean = false) => {
        if (!soundData || forceFetch) {
            const sound = await fetchMyInstantSound(link)
            if (sound) {
                const { fileName } = sound;

                const newConfig = await getConfig()

                newConfig.sounds ??= {}
                if (fileName in newConfig.sounds) return toast(`${fileName} is already in the soundboard`, { type: "error" })

                setSoundData(sound)
            }
        } else {
            const { data, fileName, title } = soundData;

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
                setSoundData(null)
            }

            setSounds(Object.values(newConfig.sounds))
            saveConfig(newConfig)
        }
    }

    return (
        <Modal open={open} setOpen={setOpen} className='w-full h-full p-0'>
            <div className='w-full h-full flex flex-col gap-2.5 justify-between p-2'>
                <form className='w-auto' onSubmit={(e) => {
                    e.preventDefault()
                    handleUpload(true)
                }}>
                    <input placeholder='Type the link of a sound' type="text" name="keybind" className="p-1 w-full rounded-sm border-2 border-[#3a3a3a]" value={link} onChange={(e) => setLink(e.target.value)} />
                </form>
                <div className='h-full w-full flex flex-col items-center [&>svg]:text-8xl justify-center'>
                    {soundData ?
                        <>
                            <h4 className='text-3xl'>Title: {soundData.title}</h4>
                            <span>File name: {soundData.fileName}</span>
                        </>
                        :
                        <>
                            <TbDragDrop />
                            <span>Drag and drop here</span>
                        </>
                    }
                </div>
                {soundData && <button onClick={() => handleUpload()}>Upload</button>}
            </div>
        </Modal >
    )
}

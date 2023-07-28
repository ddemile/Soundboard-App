import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import Modal from './Modal.tsx'
import useConfig from '../hooks/useConfig.ts'
import fetchMyInstantSound from '../utils/fetchMyInstantSound.ts'
import { BaseDirectory, writeBinaryFile } from '@tauri-apps/api/fs'
import { toast } from 'react-toastify'
import AppContext from '../contexts/AppContext.tsx'
import useLog from '../hooks/useLog.ts'
import fetchMyInstantSounds from '../utils/fetchMyInstantSounds.ts'
import { BsPlayFill } from 'react-icons/bs'

export default function UploadModal({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
    const { setSounds } = useContext(AppContext)!
    const [query, setQuery] = useState<string | undefined>("")
    const { config: getConfig, saveConfig } = useConfig()
    const [_config, setConfig] = useState<any>();
    const log = useLog()
    const [instants, setInstants] = useState<any>([])

    useEffect(() => {
        getConfig().then(config => {
            setConfig(config);
        })

        fetchMyInstantSounds().then(instants => setInstants(instants))
    }, [])

    const handleSearch = async () => {
        try {
            const url = new URL(query!)
            if (url.hostname == "www.myinstants.com") {
                const sound = await fetchMyInstantSound(query!)

                setInstants([sound])
            } else {
                toast("Invalid link provided", { type: "error" })
            }
        } catch {
            const instants = await fetchMyInstantSounds(query)
            setInstants(instants)
        }
    }

    const handleUpload = async (instant: any) => {
        const sound = await fetchMyInstantSound(instant.url);


        if (!sound) return;

        const { data, fileName, title } = sound

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
            setQuery("")
        }

        setSounds(Object.values(newConfig.sounds))
        saveConfig(newConfig)
    }


    return (
        <Modal open={open} setOpen={setOpen} className='w-full h-full p-0'>
            <div className='w-full h-full flex flex-col gap-2.5 justify-between p-2'>
                <form className='w-auto' onSubmit={(e) => {
                    e.preventDefault()
                    handleSearch()
                }}>
                    <input placeholder='Type the link of a sound' type="text" name="keybind" className="p-1 w-full rounded-sm border-2 border-[#3a3a3a]" value={query} onChange={(e) => setQuery(e.target.value)} />
                </form>
                <ul className='h-full w-full grid grid-rows-[min-content] lg:grid-cols-7 md:grid-cols-4 sm:grid-cols-2 gap-4'>
                    {instants.map((instant: any, index: number) => instant && <li className='flex flex-col items-center bg-zinc-800 rounded-2xl' key={index}>
                        <div style={{ color: instant?.color ?? "#ffffff" }} className='text-4xl cursor-pointer rounded-full aspect-square flex justify-center items-center w-10'><BsPlayFill /></div>
                        <span className='text-ellipsis line-clamp-2'>{instant.title}</span>
                        <button className='mt-auto bg-zinc-900 rounded-none items-center p-1 flex w-full rounded-b-2xl justify-center' onClick={() => handleUpload(instant)}>
                            Download
                        </button>
                    </li>)}
                </ul>
            </div>
        </Modal >
    )
}

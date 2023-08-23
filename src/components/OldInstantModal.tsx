import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import Modal from './modals/Modal.tsx'
import useConfig from '../hooks/useConfig.ts'
import fetchMyInstantSound from '../utils/fetchMyInstantSound.ts'
import { BaseDirectory, writeBinaryFile } from '@tauri-apps/api/fs'
import { toast } from 'react-toastify'
import AppContext from '../contexts/AppContext.tsx'
import useLog from '../hooks/useLog.ts'
import fetchMyInstantSounds from '../utils/fetchMyInstantSounds.ts'
import { BsPlayFill, BsStopCircleFill } from 'react-icons/bs'
import ProgressBar from './ProgressBar.tsx'
import downloadMyInstantSound from '../utils/downloadMyInstantSound.ts'

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
        if (!instant) return;

        const { fileName, title } = instant

        const data = await downloadMyInstantSound(instant, async (progressEvent) => {
            setInstants((_newInstants: any[]) => {
                const newInstants = structuredClone(_newInstants)

                if (!progressEvent.total) return newInstants;

                let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    
                const { fileName, title } = instant;
                        
                const sound = {
                    name: title,
                    file: fileName,
                    keybind: "" 
                }

                let savedInstant = newInstants.find((_instant: any) => _instant.fileName == instant.fileName)

                if (!savedInstant) {
                    newInstants.push(sound)
                    savedInstant = newInstants.find((_instant: any) => _instant.fileName == instant.fileName)
                }

                if (percentCompleted == 100) log(`Downloaded: ${fileName}`)
                    
                savedInstant.downloadProgress = percentCompleted;

                return newInstants
            })
        });

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
            // setOpen(false)
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
                    <input placeholder='Type the link of a sound' type="text" name="search" className="p-1 w-full rounded-sm border-2 border-[#3a3a3a]" value={query} onChange={(e) => setQuery(e.target.value)} />
                </form>
                <ul className='h-full w-full grid grid-rows-[min-content] lg:grid-cols-7 md:grid-cols-4 sm:grid-cols-2 gap-4'>
                    {instants.map((instant: any, index: number) => instant && <li className='flex flex-col items-center bg-zinc-800 rounded-2xl' key={index}>
                        <audio id={instant.fileName.replaceAll(".", '')}></audio>
                        <div onClick={() => {
                            const newInstants = structuredClone(instants)
                            const newInstant = newInstants.find(({ fileName }: any) => fileName == instant.fileName)

                            const audio: HTMLAudioElement = document.querySelector(`#${instant.fileName.replaceAll(".", '')}`)!

                            if (audio?.currentTime > 0) {
                                audio.pause()
                                audio.currentTime = 0;
                                newInstant.playing = false;
                                return setInstants(newInstants)
                            }

                            audio.src = instant.downloadUrl
                            audio.addEventListener("ended", () => {
                                setInstants((instants: any[]) => {
                                    const newInstants = structuredClone(instants)
                                    const newInstant = newInstants.find(({ fileName }: any) => fileName == instant.fileName)
                                    audio.currentTime = 0;
                                    newInstant.playing = false
                                    return newInstants
                                })
                            })
                            audio.play()
                            newInstant.playing = true
                            setInstants(newInstants)
                        }} style={{ color: instant?.color ?? "#ffffff" }} className='text-4xl cursor-pointer rounded-full aspect-square flex justify-center items-center w-10'>{instant.playing ?<BsStopCircleFill /> :<BsPlayFill />}</div>
                        <span className='text-ellipsis line-clamp-2'>{instant.title}</span>
                        {<ProgressBar className='mt-auto' progressPercentage={instant.downloadProgress ?? 0} />}
                        <button className='bg-zinc-900 rounded-none items-center p-1 flex w-full rounded-b-2xl justify-center' onClick={() => handleUpload(instant)}>
                            Download
                        </button>
                    </li>)}
                </ul>
            </div>
        </Modal >
    )
}

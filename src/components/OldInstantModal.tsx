import { BaseDirectory, writeBinaryFile } from '@tauri-apps/api/fs'
import { useEffect, useState } from 'react'
import { BsDownload, BsPlayFill, BsStopCircleFill } from 'react-icons/bs'
import { toast } from 'react-toastify'
import useCategories from '../hooks/useCategories.ts'
import useConfig from '../hooks/useConfig.ts'
import useLog from '../hooks/useLog.ts'
import useModal from '../hooks/useModal.ts'
import downloadMyInstantSound from '../utils/downloadMyInstantSound.ts'
import fetchMyInstantSound from '../utils/fetchMyInstantSound.ts'
import fetchMyInstantSounds from '../utils/fetchMyInstantSounds.ts'
import Modal from './modals/Modal.tsx'

export default function MyInstantModal() {
    const [query, setQuery] = useState<string | undefined>("")
    const { config: getConfig } = useConfig()
    const { categories, addSound } = useCategories()
    const [_config, setConfig] = useState<any>();
    const log = useLog()
    const [instants, setInstants] = useState<any>([])
    const { isOpen, setIsOpen, props } = useModal("my-instants")

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

    const handleDowload = async (instant: any) => {
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

        for (const category of categories) {
            if (category.sounds.some(sound => sound.file == fileName)) return toast(`${fileName} is already in the soundboard`, { type: "error" })
        }

        if (data instanceof ArrayBuffer) {
            await writeBinaryFile(fileName, data, { dir: BaseDirectory.AppCache })

            const sound = {
                name: title,
                file: fileName,
                keybind: "",
                config: {
                    volume: 100
                }
            }

            log(`${sound.name} uploaded`)
            toast(`${sound.name} uploaded`, { type: "success" })
            addSound(sound, props.category ?? "Default")
            setQuery("")
        }
    }

    const handlePlay = (instant: any) => {
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
    }

    return (
        <Modal open={isOpen} setOpen={setIsOpen} className='w-full h-full p-0 bg-[#303031]'>
            <div className='w-full flex flex-col gap-2.5 justify-between p-2'>
                <form className='w-auto' onSubmit={(e) => {
                    e.preventDefault()
                    handleSearch()
                }}>
                    <input placeholder='Type the link of a sound' type="text" name="search" className="p-1 w-full rounded-sm border-2 border-[#3a3a3a]" value={query} onChange={(e) => setQuery(e.target.value)} />
                </form>
                <ul className='w-full grid lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-2 gap-4'>
                    {instants.map((instant: any, index: number) => instant && <li className='bg-[#232324] gap-2 p-3 rounded-md flex items-center' key={index}>
                        <audio id={instant.fileName.replaceAll(".", '')}></audio>
                        <span className='text-xl cursor-pointer' onClick={() => handlePlay(instant)}>{instant.playing ? <BsStopCircleFill /> : <BsPlayFill />}</span>
                        <div className='flex flex-col text-left whitespace-nowrap text-ellipsis overflow-hidden'>
                            <span className='whitespace-nowrap text-ellipsis overflow-hidden text-left font-semibold'>{instant.title}</span>
                            <span className='whitespace-nowrap text-ellipsis overflow-hidden text-xs'>{instant.fileName}</span>
                        </div>
                        <span className='ml-auto text-xl cursor-pointer' onClick={() => handleDowload(instant)}><BsDownload /></span>
                    </li>)}
                </ul>
            </div>
        </Modal >
    )
}
import { useInfiniteQuery } from "@tanstack/react-query"
import { basename } from "@tauri-apps/api/path"
import axios from 'axios'
import { useEffect, useState } from 'react'
import { BsDownload, BsPlayFill, BsStopCircleFill } from 'react-icons/bs'
import { FaSpinner } from "react-icons/fa6"
import { toast } from 'sonner'
import useCategories from '../../hooks/useCategories.ts'
import useConfig from '../../hooks/useConfig.ts'
import useLog from '../../hooks/useLog.ts'
import useModal from '../../hooks/useModal.ts'
import useWebsocket from '../../hooks/useWebsocket.ts'
import { SoundEntry } from '../../pages/Home.tsx'
import { BASE_API_URL } from "../../utils/constants.ts"
import downloadMyInstantSound from '../../utils/downloadMyInstantSound.ts'
import Modal from './Modal.tsx'

async function fetchPage(page: number, query: string) {
    try {
        const url = new URL(query!)
        if (url.hostname == "www.myinstants.com") {
            const { data: sound } = await axios.get(`${BASE_API_URL}/my-instants/instants/${await basename(url.pathname)}`)

            toast.success("Loaded 1 sound")

            return [sound]
        } else {
            toast.error("Invalid link provided")
        }
    } catch {
        const url = new URL(`${BASE_API_URL}/my-instants`)

        if (query) {
            url.searchParams.set("search", query)
        }

        url.searchParams.set("page", page.toString())

        const { data: instants } = await axios.get(url.toString())

        return instants
    }
}

export default function MyInstantModal() {
    const [query, setQuery] = useState("")
    const [savedQuery, setSavedQuery] = useState(query)
    const { categories } = useCategories()
    const { saveConfig } = useConfig()
    const log = useLog()
    const { isOpen, setIsOpen, props } = useModal("my-instants")
    const { websocket } = useWebsocket()
    const [instants, setInstants] = useState<any>([])


    const {
        fetchNextPage,
        isFetching,
        isFetchingNextPage,
        data: apiInstants
    } = useInfiniteQuery({
        queryKey: ["instants", savedQuery],
        queryFn: ({ pageParam }) => fetchPage(pageParam, query),
        initialPageParam: 1,
        getNextPageParam: (_lastPage, _allPages, lastPageParam) =>
            lastPageParam + 1,
        getPreviousPageParam: (_firstPage, _allPages, firstPageParam) =>
            firstPageParam - 1,
    })

    useEffect(() => {
        setInstants(apiInstants?.pages.reduce((accumulator, page) => [...accumulator, ...page], []) ?? [])
    }, [apiInstants])

    const handleSearch = async () => {
        setSavedQuery(query)
    }

    const handleDownload = async (instant: any) => {
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
            if (category.sounds.some(sound => sound.title == fileName)) return toast.error(`${fileName} is already in the soundboard`)
        }

        if (data instanceof ArrayBuffer) {
            const sound = {
                title,
                keybind: "",
                config: { volume: 100 },
                category: props.category
            } satisfies Omit<SoundEntry, "id"> & { id?: string }

            await websocket.emitWithAck("upload_sound", sound, data)

            log(`${sound.title} uploaded`)
            toast.success(`${sound.title} uploaded`)
            // addSound(sound as any as SoundEntry, props.category ?? "Default")
            saveConfig()
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
                if (newInstant) newInstant.playing = false
                return newInstants
            })
        })
        audio.play()
        newInstant.playing = true
        setInstants(newInstants)
    }

    return (
        <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} className='rounded-lg m-4 w-full h-auto p-0 bg-neutral-200 dark:bg-[#303031] justify-start overflow-y-auto' overlayClassName="flex justify-normal items-stretch">
            <div className='w-full h-full flex flex-col gap-2.5 p-2'>
                <form className='w-auto' onSubmit={(e) => {
                    e.preventDefault()
                    handleSearch()
                }}>
                    <input placeholder='Type the link of a sound' type="text" name="search" className="p-1 w-full rounded-sm border-2 border-neutral-300 dark:border-[#3a3a3a]" value={query} onChange={(e) => setQuery(e.target.value)} />
                </form>
                {isFetching && !isFetchingNextPage ? (
                    <FaSpinner className="animate-spin m-auto mt-auto h-full" size={40} />
                ) : (
                    <>
                        <ul className='w-full grid lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-2 gap-4'>
                            {instants.map((instant: any, index: number) => instant && <li className='bg-neutral-300 dark:bg-[#232324] gap-2 p-3 rounded-md flex items-center' key={index}>
                                <audio id={instant.fileName.replaceAll(".", '')}></audio>
                                <span className='text-xl cursor-pointer' onClick={() => handlePlay(instant)}>{instant.playing ? <BsStopCircleFill /> : <BsPlayFill />}</span>
                                <div className='flex flex-col text-left whitespace-nowrap text-ellipsis overflow-hidden'>
                                    <span className='whitespace-nowrap text-ellipsis overflow-hidden text-left font-semibold'>{instant.title}</span>
                                    <span className='whitespace-nowrap text-ellipsis overflow-hidden text-xs'>{instant.fileName}</span>
                                </div>
                                <span className='ml-auto text-xl cursor-pointer' onClick={() => handleDownload(instant)}><BsDownload /></span>
                            </li>)}
                        </ul>
                        {isFetchingNextPage ? (
                            <span className="mx-auto pb-1">
                                <FaSpinner className="animate-spin" size={20} />
                            </span>
                        ): (
                            <button className="focus:outline-hidden" onClick={() => fetchNextPage()}>Load more</button>
                        )}
                    </>
                )}
            </div >
        </Modal >
    )
}
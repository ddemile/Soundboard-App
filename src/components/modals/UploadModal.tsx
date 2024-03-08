import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react"
import { ChangeEvent, FormEvent, useLayoutEffect, useState } from "react"
import { IoCloseSharp } from "react-icons/io5"
import { toast } from "sonner"
import useCategories from "../../hooks/useCategories.ts"
import useConfig from "../../hooks/useConfig.ts"
import useLog from "../../hooks/useLog.ts"
import useModal from "../../hooks/useModal.ts"
import useWebsocket from "../../hooks/useWebsocket.ts"
import { SoundEntry } from "../../pages/Home.tsx"
import Button from "./Button.tsx"
import Modal from "./Modal.tsx"

export default function UploadModal() {
  const { isOpen, setIsOpen, props, setProps, close } = useModal("upload")
  const [sounds, setSounds] = useState<{ file: File, data: Partial<SoundEntry> }[]>(props.files ? props.files.map((file: File) => ({ file, data: {} })) : [])
  const { categories } = useCategories()
  const { saveConfig } = useConfig()
  const log = useLog()
  const { websocket } = useWebsocket();
  const [index, setIndex] = useState(0)
  const [emojiSelectorProps, setEmojiSelectorProps] = useState({ open: false, x: 0, y: 0 })
  const [isUploading, setIsUploading] = useState(false);
  const sound = sounds[index]

  if (!props.files) setProps({ ...props, files: [] })

  useLayoutEffect(() => {
    setSounds(props.files ? props.files.map((file: File) => ({ file, data: {} })) : [])
    setIndex(0)
  }, [props])


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    log(`${name}: ${value}`)

    const { file } = sound;

    setSounds((_sounds) => {
      const sounds = structuredClone(_sounds)
      const sound = sounds.find(_sound => _sound.file.name == file.name)
      if (sound) {
        sound.data.title = value;
      }

      return sounds
    })
  }

  const handleSave = async () => {
    if ((index + 1) == sounds.length) {
      setIsUploading(true);
      for await (let sound of sounds) {
        if (sound && sound.file) {
          const { file, data } = sound;

          for (const category of categories) {
            if (category.sounds.some(sound => sound.file == file.name)) return toast.error(`${file.name} is already in the soundboard`)
          }

          const uploadPromise: Promise<SoundEntry> = new Promise(async (resolve, reject) => {
            const content = await readFileContent(file)
            if (content instanceof ArrayBuffer) {  
              const sound = {
                title: file.name.split(".")[0],
                file: file.name as `${string}.${string}`,
                keybind: "",
                config: { volume: 100 },
                category: props.category ?? "Default",
                ...data
              } satisfies Omit<SoundEntry, "id"> & { id?: string }

              await websocket.emitWithAck("uploadSound", sound, content)

              log(`${sound.title} uploaded`)
              saveConfig()
              resolve(sound as SoundEntry)
            } else {
              reject("Invalid file")
            }
          })

          const soundName = file.name.split(".")[0]

          toast.promise(uploadPromise, {
            error: `Cannot upload ${soundName}`,
            loading: `Uploading ${soundName}`,
            success: `${soundName} uploaded`
          })

          await uploadPromise;
        }
      }
      if (sounds.length > 1) {
        toast.success("All sounds uploaded")
      }
      setIsUploading(false);
      close()
    } else {
      setIndex(index => index + 1)
    }
  }

  const handleInputChange = (e: FormEvent<HTMLInputElement>) => {
    setSounds((_sounds) => {
      const sounds = structuredClone(_sounds)
      let soundIndex = sounds.findIndex(_sound => _sound.file.name == sound?.file.name)

      const target = e.target as HTMLInputElement
      if (target.files && target.files[0]) {
        const object = { file: target.files[0], data: {} }
        if (soundIndex < 0) {
          sounds.push(object)
        } else {
          sounds[soundIndex] = object
        }
      }

      return sounds
    })
  }

  return <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} onAfterClose={() => setSounds([])}>
    <div className="absolute z-30" style={{ top: emojiSelectorProps.y, left: emojiSelectorProps.x, display: emojiSelectorProps.open ? "inherit" : "none" }}>
      {emojiSelectorProps.open &&
        <EmojiPicker skinTonesDisabled emojiStyle={EmojiStyle.NATIVE} theme={Theme.DARK} onEmojiClick={({ emoji, names }) => {
          setEmojiSelectorProps({ ...emojiSelectorProps, open: false })

          const { file } = sound;

          setSounds((_sounds) => {
            const sounds = structuredClone(_sounds)
            const sound = sounds.find(_sound => _sound.file.name == file.name)

            if (sound) {
              sound.data.emojiName = names[0].replace(/ /g, "_");
              sound.data.emoji = emoji;
            }

            return sounds
          })
        }} />
      }
    </div>
    <div className="rounded-lg w-[440px] overflow-hidden mx-auto" onClick={() => setEmojiSelectorProps({ ...emojiSelectorProps, open: false })}>
      <div className="bg-[#303031] p-2 relative flex flex-col">
        <button onClick={() => setIsOpen(false)} className="absolute right-0 top-0 m-2 border-none outline-none focus:outline-none p-0 bg-transparent text-2xl text-stone-500 hover:text-stone-400 transition-colors">
          <IoCloseSharp />
        </button>
        <p className="font-bold text-2xl mt-1">{sounds.length > 1 ? "Import sounds" : "Import sound"}</p>
        <ul className="flex gap-2 flex-col">
          <li className="text-left flex flex-col gap-1 mt-8">
            <label className="text-sm font-bold text-zinc-300">FILE</label>
            <label className="bg-zinc-800 border-zinc-900 border-[1px] rounded-sm p-2 flex">
              <span>{sound?.file.name ?? "Click navigate"}</span>
              <label htmlFor="upload" className="ml-auto flex items-center cursor-pointer rounded-md bg-blue-500 p-0.5 px-2 text-xs h-auto">Navigate</label>
            </label>
            <input onChange={handleInputChange} id="upload" type="file" accept="audio/*" className="hidden"></input>
          </li>
          <li className="text-left flex gap-4">
            <div className="flex flex-col w-full">
              <label className="text-sm font-bold text-zinc-300">SOUND NAME</label>
              <input name="name" onChange={handleChange} value={sound?.data?.title ?? sound?.file?.name?.split(".")[0] ?? ""} className="bg-zinc-900 rounded-sm p-2"></input>
            </div>
            <div className="flex flex-col w-full">
              <label className="text-sm font-bold text-zinc-300">EMOJI</label>
              <p onClick={(e) => {
                e.stopPropagation()
                setEmojiSelectorProps({ open: true, x: e.pageX, y: e.pageY })
              }} className="bg-zinc-900 rounded-sm p-2 flex cursor-pointer">
                <input className="w-0" />
                <span className="flex gap-2">
                  <span>{sound?.data.emoji || "🎵"} </span>
                  <span>:{sound?.data.emojiName || "musical_note"}:</span>
                </span>
              </p>
            </div>
          </li>
        </ul>
      </div>
      <div className="bg-zinc-800 p-3 flex justify-end gap-2">
        <Button onClick={close} type="discard">Discard</Button>
        <Button onClick={handleSave} disabled={sounds.length == 0 || isUploading} type="validate">{((index + 1) == sounds.length || sounds.length < 1) ? "Import" : "Next"}</Button>
      </div>
    </div>
  </Modal>
}

async function readFileContent(file: any): Promise<string | ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const fileContent = event.target?.result;
      if (fileContent) {
        resolve(fileContent);
      } else {
        reject()
      }

    };

    reader.readAsArrayBuffer(file);
  })
}
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react"
import { ChangeEvent, FormEvent, useEffect, useLayoutEffect, useState } from "react"
import { toast } from "sonner"
import useCategories from "../../hooks/useCategories.ts"
import useConfig from "../../hooks/useConfig.ts"
import useLog from "../../hooks/useLog.ts"
import useModal from "../../hooks/useModal.ts"
import useWebsocket from "../../hooks/useWebsocket.ts"
import { SoundEntry } from "../../pages/Home.tsx"
import { Button } from "../ui/button.tsx"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card.tsx"
import { Input } from "../ui/input.tsx"
import { Label } from "../ui/label.tsx"
import Modal from "./Modal.tsx"

interface SoundPrimitive extends Omit<SoundEntry, "id"> {
  id?: string;
  file: string
}

export default function UploadModal() {
  const { isOpen, setIsOpen, props, setProps, close } = useModal("upload")
  const [sounds, setSounds] = useState<{ file: File, data: Partial<SoundEntry> }[]>(props.files ? props.files.map((file: File) => ({ file, data: {} })) : [])
  const { categories } = useCategories()
  const { saveConfig } = useConfig()
  const log = useLog()
  const { websocket, data: socketData } = useWebsocket();
  const [index, setIndex] = useState(0)
  const [emojiSelectorProps, setEmojiSelectorProps] = useState({ open: false, x: 0, y: 0 })
  const [isUploading, setIsUploading] = useState(false);
  const sound = sounds[index]

  if (!props.files) setProps({ ...props, files: [] })

  useLayoutEffect(() => {
    setSounds(props.files ? props.files.map((file: File) => ({ file, data: {} })) : [])
    setIndex(0)
  }, [props])

  useEffect(() => {
    const listener: (this: Document, ev: MouseEvent) => void = (e) => {
      let element = e.target as HTMLElement;
      let contains = false;
      while (!contains && element != null) {
        contains = element?.classList.contains("EmojiPickerReact")
        element = element.parentElement!;
      }

      if (!contains) setEmojiSelectorProps({
        ...emojiSelectorProps,
        open: false
      })
    }

    document.addEventListener("click", listener)

    return () => {
      document.removeEventListener("click", listener)
    }
  }, [emojiSelectorProps])

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
            if (category.sounds.some(sound => sound.title == file.name)) return toast.error(`${file.name} is already in the soundboard`)
          }

          const uploadPromise: Promise<SoundEntry> = new Promise(async (resolve, reject) => {
            const content = await readFileContent(file)
            if (content instanceof ArrayBuffer) {  
              if (content.byteLength > (socketData?.soundSizeLimit || 0)) return reject(`Maximum size allowed: ${parseFloat(((socketData?.soundSizeLimit ?? 0) / 1e6).toFixed(2))}mb`);

              const sound = {
                title: file.name.split(".")[0],
                file: file.name,
                keybind: "",
                config: { volume: 100 },
                category: props.category ?? "Default",
                ...data
              } satisfies SoundPrimitive

              const { error, message } = await websocket.emitWithAck("upload_sound", sound, content)

              if (error) return reject(message)

              log(`${sound.title} uploaded`)
              saveConfig()
              resolve(sound as SoundEntry)
            } else {
              reject("Invalid file")
            }
          })

          const soundName = file.name.split(".")[0]

          toast.promise(uploadPromise, {
            error: (error) => error,
            loading: `Uploading ${soundName}`,
            success: `${soundName} uploaded`
          })
          
          await uploadPromise.catch(() => {});
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

  return <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} onAfterClose={() => setSounds([])} className="w-[400px]">
    <div className="absolute z-30" style={{ top: emojiSelectorProps.y, left: emojiSelectorProps.x, display: emojiSelectorProps.open ? "inherit" : "none" }}>
      {emojiSelectorProps.open &&
        <EmojiPicker skinTonesDisabled emojiStyle={EmojiStyle.NATIVE} theme={Theme.AUTO} onEmojiClick={({ emoji, names }) => {
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
    
    <form onSubmit={(e) => {
      e.preventDefault()

      if (sounds.length == 0 || isUploading) return;

      handleSave()
    }}>
      <Card>
        <CardHeader>
          <CardTitle>{sounds.length > 1 ? "Import sounds" : "Import sound"}</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">File</Label>
                <Input onChange={handleInputChange} id="upload" type="file" accept="audio/*" disabled={isUploading} placeholder="Title of your sound" />
            </div>
            <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Sound name</Label>
                <Input id="name" name="name" onChange={handleChange} value={sound?.data?.title ?? sound?.file?.name?.split(".")[0] ?? ""} disabled={sounds.length == 0 || isUploading} placeholder="Title of your sound" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label>Emoji</Label>
              <Button id="emoji" type="button" variant="outline" disabled={sounds.length == 0 || isUploading} onClick={(e) => {
                e.stopPropagation()

                setEmojiSelectorProps({ open: true, x: e.pageX, y: e.pageY })
              }}>
                  <span>{sound?.data.emoji || "🎵"} </span>
                  <span className="overflow-hidden text-ellipsis">:{sound?.data.emojiName || "musical_note"}:</span>
              </Button>
          </div>
        </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={close}>Cancel</Button>
          <Button type="submit" disabled={sounds.length == 0 || isUploading}>{((index + 1) == sounds.length || sounds.length < 1) ? "Import" : "Next"}</Button>
        </CardFooter>
      </Card>
    </form>
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
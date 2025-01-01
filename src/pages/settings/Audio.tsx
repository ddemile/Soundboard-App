import { Slider } from "@/components/ui/slider.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import isEqual from "lodash.isequal";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import useAudioPlayer from "../../hooks/useAudioPlayer.ts";
import useConfig from "../../hooks/useConfig.ts";

const Separator = () => <li className="w-full h-px bg-zinc-300 dark:bg-zinc-600" />

const buttonVariants = {
  discard: "p-1 rounded-sm bg-transparent focus:outline-hidden border-none hover:underline",
  validate: "disabled:bg-blue-500 dark:disabled:bg-blue-900 text-white disabled:text-zinc-300 dark:disabled:text-zinc-400 disabled:cursor-not-allowed rounded-md bg-blue-400 hover:bg-blue-500 transition-colors duration-300 p-1 px-4",
  danger: "text-white disabled:text-zinc-400 disabled:cursor-not-allowed rounded-md bg-red-500 dark:bg-red-800 hover:bg-red-600 dark:hover:bg-red-900 transition-colors duration-300 p-1 px-4"
}

function Button({ children, variant, className, ...props }: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & { variant: keyof typeof buttonVariants}) {    
  return (
    <>
      <button {...props} className={twMerge(buttonVariants[variant], className)}>{children}</button>
    </>
  )
}

export default function Audio() {
  const { globalSetVolume } = useAudioPlayer()
  const { config, updateConfig, saveConfig } = useConfig()
  const [savedAudioConfig, setSavedAudioConfig] = useState(config.audio)
  const [audioConfig, setAudioConfig] = useState(config.audio)

  const handleSave = () => {
    globalSetVolume(([title]) => title.startsWith("distant"), audioConfig.soundsVolume)
    globalSetVolume(([title]) => title.startsWith("preview"), audioConfig.previewVolume)
    updateConfig({ audio: audioConfig })
    saveConfig()
    setSavedAudioConfig(audioConfig)
  }

  return (
    <>
      <h1 className='text-3xl font-semibold text-left mb-2'>Audio</h1>
      <ul className="w-full flex flex-col items-center gap-3 max-w-3xl">
        <li className="flex gap-2 w-full">
          <div className="text-left flex flex-col gap-1 w-full">
            <label className="text-sm font-bold text-gray-500 dark:text-gray-300 mb-2">PREVIEW VOLUME</label>
            <Slider className="mb-1" max={100} step={1} name="volume" onValueChange={(values) => setAudioConfig({ ...audioConfig, previewVolume: values[0] })} value={[audioConfig.previewVolume ?? 100]} />
          </div>
          <div className="text-left flex flex-col gap-1 w-full">
            <label className="text-sm font-bold text-gray-500 dark:text-gray-300 mb-2">SOUNDS VOLUME</label>
            <Slider className="mb-1" max={100} step={1} name="volume" onValueChange={(values) => setAudioConfig({ ...audioConfig, soundsVolume: values[0] })} value={[audioConfig.soundsVolume ?? 100]} />
            {/* <input name="volume" onChange={(e) => setAudioConfig({ ...audioConfig, soundsVolume: parseInt(e.target.value) })} value={audioConfig.soundsVolume ?? 100} type="range" className=""></input> */}
          </div>
        </li>
        <Separator />
        <li className="flex w-full items-center flex-col">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-300 text-left w-full">OTHER</h2>
          <div className="flex w-full items-center justify-between">
            <span className="text-lg">Use the soundboard app sounds</span>
            <Switch checked={audioConfig.useSoundoardAppSounds || false} onCheckedChange={(checked) => setAudioConfig({ ...audioConfig, useSoundoardAppSounds: checked })} />
          </div>
        </li>
      </ul>
      {!isEqual(savedAudioConfig, audioConfig) && (
        <div className="absolute bottom-0 right-0 w-full flex justify-center">
          <div className="px-4 py-3 bg-stone-200 dark:bg-stone-900 m-2 flex items-center gap-1 rounded-md animate-pulse">
            <span>You have unsaved modifcations, save them!</span>
            <Button variant="discard" onClick={() => setAudioConfig(savedAudioConfig)}>Discard</Button>
            <Button variant="validate" onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}
    </>
  )
}

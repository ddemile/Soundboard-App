import isEqual from "lodash.isequal";
import { useState } from "react";
import Checkbox from "../../components/Checkbox.tsx";
import Button from "../../components/modals/Button.tsx";
import useAudioPlayer from "../../hooks/useAudioPlayer.ts";
import useConfig from "../../hooks/useConfig.ts";

const Separator = () => <li className="w-full h-px bg-zinc-600"></li>

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
            <label className="text-sm font-bold text-zinc-300">PREVIEW VOLUME</label>
            <input name="volume" onChange={(e) => setAudioConfig({ ...audioConfig, previewVolume: parseInt(e.target.value) })} value={audioConfig.previewVolume ?? 100} type="range" className=""></input>
          </div>
          <div className="text-left flex flex-col gap-1 w-full">
            <label className="text-sm font-bold text-zinc-300">SOUNDS VOLUME</label>
            <input name="volume" onChange={(e) => setAudioConfig({ ...audioConfig, soundsVolume: parseInt(e.target.value) })} value={audioConfig.soundsVolume ?? 100} type="range" className=""></input>
          </div>
        </li>
        <Separator />
        <li className="flex w-full items-center flex-col">
          <h2 className="text-sm font-bold text-zinc-300 text-left w-full">OTHER</h2>
          <div className="flex w-full items-center justify-between">
            <span className="text-lg">Use the sounboard app sounds</span>
            <Checkbox checked={audioConfig.useSoundoardAppSounds || false} onChange={(e) => setAudioConfig({ ...audioConfig, useSoundoardAppSounds: e.target.checked })} />
          </div>
        </li>
      </ul>
      {!isEqual(savedAudioConfig, audioConfig) && (
        <div className="absolute bottom-0 right-0 w-full flex justify-center">
          <div className="px-4 py-3 bg-stone-900 m-2 flex items-center gap-1 rounded-md animate-pulse">
            <span>You have unsaved modifcations, save them!</span>
            <Button type="discard" onClick={() => setAudioConfig(savedAudioConfig)}>Discard</Button>
            <Button type="validate" onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}
    </>
  )
}

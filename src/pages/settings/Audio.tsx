import isEqual from "lodash.isequal";
import { useState } from "react";
import Checkbox from "../../components/Checkbox.tsx";
import Button from "../../components/modals/Button.tsx";
import useConfig from "../../hooks/useConfig.ts";

export default function Audio() {
  const { config, updateConfig, saveConfig } = useConfig()
  const [savedAudioConfig, setSavedAudioConfig] = useState(config.audio)
  const [audioConfig, setAudioConfig] = useState(config.audio)

  const handleSave = () => {
    updateConfig({ audio: audioConfig })
    saveConfig()
    setSavedAudioConfig(audioConfig)
  }

  return (
    <>
      <h1 className='text-3xl font-semibold text-left mb-2'>Audio</h1>
      <div className="w-full flex flex-col items-center gap-2 max-w-3xl">
        <div className="flex justify-between w-full items-center">
          <span className="text-lg">Use the sounboard app sounds</span>
          <Checkbox checked={audioConfig.useSoundoardAppSounds || false} onChange={(e) => setAudioConfig({ ...audioConfig, useSoundoardAppSounds: e.target.checked })} />
        </div>
      </div>
      {!isEqual(savedAudioConfig, audioConfig) && (
        <div className="absolute bottom-0 right-0 w-full flex justify-center">
          <div className="px-4 py-3 bg-stone-900 m-2 flex items-center gap-1 rounded-md hover:animate-pulse">
            <span>You have unsaved modifcations, save them!</span>
            <Button type="discard" onClick={() => setAudioConfig(savedAudioConfig)}>Discard</Button>
            <Button type="validate" onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}
    </>
  )
}

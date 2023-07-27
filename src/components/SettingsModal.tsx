import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import Modal from './Modal.tsx'
import { register, unregister } from '@tauri-apps/api/globalShortcut'
import useConfig from '../hooks/useConfig.ts'
import useWebsocket from '../hooks/useWebsocket.ts'

export default function SettingsModal({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
  const [keybind, setKeybind] = useState<string>("")
  const { config: getConfig, saveConfig } = useConfig()
  const [config, setConfig] = useState<any>();
  const websocket = useWebsocket()

  useEffect(() => {
    getConfig().then(config => {
      setConfig(config);

      if (config.stopKeybind) {
        setKeybind(config.stopKeybind)
      }
    })
  }, [])

  const handleClose = () => {
    console.log("close")

    const oldKeybind = config.stopKeybind

    if (oldKeybind != keybind) {
      if (oldKeybind) {
        unregister(oldKeybind)
      }

      if (keybind) {
        register(keybind, () => {
          websocket.emit("stopSound")
        })
      }

      saveConfig({ ...config, stopKeybind: keybind })
    }
  }

  return (
    <Modal open={open} setOpen={setOpen} onClose={handleClose}>
      <h3 className="text-xl font-semibold">Settings</h3>
      <div className="flex gap-2.5 flex-col">
        <div className="flex flex-col">
          <label className="text-left">Stop button keybind</label>
          <input type="text" name="keybind" className="p-1 rounded-sm border-2 border-[#3a3a3a]" value={keybind} onChange={(e) => setKeybind(e.target.value)} />
        </div>
      </div>
    </Modal >
  )
}

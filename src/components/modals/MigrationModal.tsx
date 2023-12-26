import { useEffect, useState } from "react"
import useConfig from "../../hooks/useConfig.ts"
import useModal from "../../hooks/useModal.ts"
import useWebsocket from "../../hooks/useWebsocket.ts"
import { ProgressEvent, uploadSounds } from "../../utils/migrationHelpers.ts"
import Modal from "./Modal.tsx"

export default function MigrationModal() {
  const { isOpen, setIsOpen, props, setProps } = useModal("migration")
  const { config, updateConfig, saveConfig } = useConfig()
  const { websocket } = useWebsocket();
  const [progressState, setProgressState] = useState<ProgressEvent>()
  const [finished, setFinished] = useState(false);

  if (!props.files) setProps({ ...props, files: [] })

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key == "F5" || e.key == "Escape" || (e.key == "r" && e.ctrlKey)) e.preventDefault();
    }

    if (isOpen) {
      document.addEventListener("keydown", listener)
    }

    return () => {
      document.removeEventListener("keydown", listener)
    }
  }, [isOpen])

  const handleStart = () => {
    uploadSounds(config.categories, websocket, (event) => {
      setProgressState(event)

      if (event.finished) {
        setFinished(true)
        updateConfig({ migrated: true })
        saveConfig()
        websocket.emit("request_categories")
      }
    })
  }

  return <Modal open={isOpen} setOpen={setIsOpen} className="flex justify-center flex-col min-w-full min-h-screen bg-transparent" closable={false}>
    <div className="rounded-lg w-[440px] overflow-hidden mx-auto">
      <div className="bg-[#303031] p-2 relative flex flex-col">
        <p className="font-bold text-2xl mt-1">Migration needed</p>
        <p className="font-medium text-sm mt-1">The last release has changed the application structure and so all of your sounds needs to be uploaded in the cloud.</p>
        <ul className="flex gap-2 flex-col">
          <li className="text-left flex flex-col gap-1 mt-8">
            <label className="text-sm font-bold text-zinc-300">STATUS</label>
            <label className="bg-zinc-800 border-zinc-900 border-[1px] rounded-sm p-2 flex">
              {progressState ?
                <p>Uploading sound {progressState.currentlyUploading} out of {progressState.totalSounds} ({progressState.uploadsFailed} failed)</p>
              : 
                <p>Not started</p>
              }
            </label>
          </li>
          <li className="text-left flex flex-col gap-1">
            {finished ?
              <button className="w-full cursor-pointer rounded-md bg-blue-500 p-2 text-medium font-medium h-auto" onClick={() => setIsOpen(false)}>Close</button>
            :  
              <button className="w-full cursor-pointer rounded-md bg-blue-500 p-2 text-medium font-medium h-auto disabled:bg-opacity-80 disabled:text-neutral-300 disabled:cursor-not-allowed" disabled={!!progressState} onClick={handleStart}>Click to begin migration</button>
            }
          </li>
        </ul>
      </div>
    </div>
  </Modal>
}
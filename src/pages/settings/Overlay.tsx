import { Switch } from "@/components/ui/switch.tsx";
import isEqual from "lodash.isequal";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import useConfig from "../../hooks/useConfig.ts";

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

export default function Overlay() {
  const { config, updateConfig, saveConfig } = useConfig()
  const [savedOverlayConfig, setSavedOverlayConfig] = useState(config.overlay)
  const [overlayConfig, setOverlayConfig] = useState(config.overlay)

  const handleSave = () => {
    updateConfig({ overlay: overlayConfig })
    saveConfig()
    setSavedOverlayConfig(overlayConfig)
  }

  return (
    <>
      <h1 className='text-3xl font-semibold text-left mb-2'>Overlay</h1>
      <ul className="w-full flex flex-col items-center gap-3 max-w-3xl">
        <li className="flex w-full items-center flex-col">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-300 text-left w-full">BEHAVIOUR</h2>
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full items-center justify-between">
              <span className="text-lg">Center mouse cursor on open</span>
              <Switch checked={overlayConfig.teleportMouseToCenter || false} onCheckedChange={(checked) => setOverlayConfig({ ...overlayConfig, teleportMouseToCenter: checked })} />
            </div>
            <div className="flex w-full items-center justify-between">
              <span className="text-lg">Close overlay on click release</span>
              <Switch checked={overlayConfig.closeOnRelease || false} onCheckedChange={(checked) => setOverlayConfig({ ...overlayConfig, closeOnRelease: checked })} />
            </div>
          </div>
        </li>
      </ul>
      {!isEqual(savedOverlayConfig, overlayConfig) && (
        <div className="absolute bottom-0 right-0 w-full flex justify-center">
          <div className="px-4 py-3 bg-stone-200 dark:bg-stone-900 m-2 flex items-center gap-1 rounded-md animate-pulse">
            <span>You have unsaved modifcations, save them!</span>
            <Button variant="discard" onClick={() => setOverlayConfig(savedOverlayConfig)}>Discard</Button>
            <Button variant="validate" onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}
    </>
  )
}

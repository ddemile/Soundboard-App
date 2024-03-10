import { useState } from 'react'
import { toast } from "sonner"
import useModal from '../../hooks/useModal.ts'
import useWebsocket from '../../hooks/useWebsocket.ts'
import Audio from '../../pages/settings/Audio.tsx'
import Keybinds from '../../pages/settings/Keybinds.tsx'
import MyAccount from '../../pages/settings/MyAccount.tsx'
import Modal from './Modal.tsx'

const pages = {
  keybinds: Keybinds,
  myAccount: MyAccount,
  audio: Audio
}

export default function SettingsModal() {
  const { isOpen, setIsOpen } = useModal("settings");
  const [page, setPage] = useState<keyof typeof pages>("myAccount")
  const { websocket } = useWebsocket()

  const Page: () => JSX.Element = pages[page]

  return (
    <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} className='rounded-lg m-4 w-auto h-auto p-0 bg-[#303031] flex-row overflow-clip grow' overlayClassName="flex justify-normal items-stretch">
      <nav className='border-white border-opacity-20 border-r-2 h-full bg-[#232324] flex p-14 pr-0 flex-col'>
        <p className='text-left text-sm text-gray-300 px-2 font-semibold'>MAIN SETTINGS</p>
        <ul className='flex flex-col gap-0.5 text-left mr-1 w-48'>
          <li className='p-1.5 px-2 hover:bg-opacity-5 hover:bg-white cursor-pointer rounded-md' onClick={() => setPage("myAccount")}>My account</li>
          <li className='p-1.5 px-2 hover:bg-opacity-5 hover:bg-white cursor-pointer rounded-md' onClick={() => setPage("keybinds")}>Keybinds</li>
          <li className='p-1.5 px-2 hover:bg-opacity-5 hover:bg-white cursor-pointer rounded-md' onClick={() => setPage("audio")}>Audio</li>
          <li className={`p-1.5 px-2 hover:bg-opacity-5 hover:bg-white cursor-pointer rounded-md ${!(websocket.auth as any)?.webInterfaceCode && "hover:cursor-not-allowed"}`} onClick={() => {
            if (!(websocket.auth as any)?.webInterfaceCode) return
            navigator.clipboard.writeText(`https://soundboard.nano3.fr?code=${(websocket.auth as any)?.webInterfaceCode}`)
            toast.success("Link copied")
          }}>Copy web link</li>
        </ul>
      </nav>
      <main className='p-14 px-10 overflow-y-auto h-full inline-block w-full'>
        <Page />
      </main>
    </Modal >
  )
}
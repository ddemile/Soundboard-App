import { Codes } from '@/pages/settings/Codes.tsx'
import { useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'
import { useState } from 'react'
import { toast } from "sonner"
import useModal from '../../hooks/useModal.ts'
import useWebsocket, { socket } from '../../hooks/useWebsocket.ts'
import Audio from '../../pages/settings/Audio.tsx'
import Keybinds from '../../pages/settings/Keybinds.tsx'
import MyAccount from '../../pages/settings/MyAccount.tsx'
import Modal from './Modal.tsx'

const pages = {
  keybinds: Keybinds,
  myAccount: MyAccount,
  audio: Audio,
  codes: Codes
}

export default function SettingsModal() {
  const { isOpen, setIsOpen } = useModal("settings");
  const [page, setPage] = useState<keyof typeof pages>("myAccount")
  const { data } = useWebsocket()
  const { open: displayImage } = useModal("imageViewer")
  const queryClient = useQueryClient()
  const { websocket } = useWebsocket()

  const Page: () => JSX.Element = pages[page]

  const handleOpen = async () => {
    await queryClient.prefetchQuery({
      queryKey: ["dashboard-codes"],
      queryFn: () => websocket.emitWithAck("get_codes"),
    })
  }

  return (
    <Modal isOpen={isOpen} onAfterOpen={handleOpen} onRequestClose={() => setIsOpen(false)} className='rounded-lg m-4 w-auto h-auto p-0 bg-white dark:bg-[#303031] flex-row overflow-clip grow' overlayClassName="flex justify-normal items-stretch">
      <nav className='border-white border-opacity-20 border-r-2 h-full bg-neutral-200 dark:bg-[#232324] flex p-14 pr-0 flex-col'>
        <p className='text-left text-sm text-gray-500 dark:text-gray-300 px-2 font-semibold'>MAIN SETTINGS</p>
        <ul className='flex flex-col gap-0.5 text-left mr-1 w-48'>
          <li className='p-1.5 px-2 hover:bg-neutral-300 dark:hover:bg-opacity-5 dark:hover:bg-white cursor-pointer rounded-md' onClick={() => setPage("myAccount")}>My account</li>
          <li className='p-1.5 px-2 hover:bg-neutral-300 dark:hover:bg-opacity-5 dark:hover:bg-white cursor-pointer rounded-md' onClick={() => setPage("keybinds")}>Keybinds</li>
          <li className='p-1.5 px-2 hover:bg-neutral-300 dark:hover:bg-opacity-5 dark:hover:bg-white cursor-pointer rounded-md' onClick={() => setPage("audio")}>Audio</li>
          <li className='p-1.5 px-2 hover:bg-neutral-300 dark:hover:bg-opacity-5 dark:hover:bg-white cursor-pointer rounded-md' onClick={() => setPage("codes")}>Codes</li>
          <li className={`p-1.5 px-2 hover:bg-neutral-300 dark:hover:bg-opacity-5 dark:hover:bg-white cursor-pointer rounded-md ${!data?.webInterfaceCode && "hover:cursor-not-allowed"}`} onClick={async () => {
            
            socket.emitWithAck("generate_code", { expirationMethod: "Session" }).then((code) => {
              console.log(code)
              toast.success("Code generated")
            }).catch(() => {
              toast.error("Error")
            })
            if (!!true) return
            if (!data?.webInterfaceCode) return
            const link = `https://soundboard.nano3.fr?code=${data.webInterfaceCode}`;
            navigator.clipboard.writeText(link)
            toast.success("Link copied")
            const codeUrl = await QRCode.toDataURL(link, {
              margin: 1,
              scale: 20,
            });
            displayImage({
              src: codeUrl
            })
          }}>Copy web link</li>
        </ul>
      </nav>
      <main className='p-14 px-10 overflow-y-auto h-full inline-block w-full'>
        <Page />
      </main>
    </Modal >
  )
}
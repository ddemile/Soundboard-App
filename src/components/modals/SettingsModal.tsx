import { Codes } from '@/pages/settings/Codes.tsx'
import { useQueryClient } from '@tanstack/react-query'
import React, { HTMLProps, PropsWithChildren, useState } from 'react'
import useModal from '../../hooks/useModal.ts'
import useWebsocket from '../../hooks/useWebsocket.ts'
import Audio from '../../pages/settings/Audio.tsx'
import Keybinds from '../../pages/settings/Keybinds.tsx'
import MyAccount from '../../pages/settings/MyAccount.tsx'
import Overlay from '../../pages/settings/Overlay.tsx'
import Modal from './Modal.tsx'

const pages = {
  keybinds: Keybinds,
  myAccount: MyAccount,
  audio: Audio,
  codes: Codes,
  overlay: Overlay
}

function TabButton({ children, onClick, disabled, tab, ...props }: PropsWithChildren<{ tab?: keyof typeof pages } & Omit<HTMLProps<HTMLLIElement>, "onClick"> & { onClick: (tab: keyof typeof pages) => void}>) {
  return (
    <li {...props} className={`p-1.5 px-2 hover:bg-neutral-300 dark:hover:bg-white/5 cursor-pointer rounded-md ${disabled && "hover:cursor-not-allowed"}`} onClick={() => tab && onClick(tab)}>
      {children}
    </li>
  )
}

export default function SettingsModal() {
  const { isOpen, setIsOpen } = useModal("settings");
  const [page, setPage] = useState<keyof typeof pages>("myAccount")
  const queryClient = useQueryClient()
  const { websocket } = useWebsocket()

  const Page: () => React.JSX.Element = pages[page]

  const handleOpen = async () => {
    await queryClient.prefetchQuery({
      queryKey: ["dashboard-codes"],
      queryFn: async () => {
        const { error, data: codes } = await websocket.emitWithAck("get_codes")

        if (error) throw new Error(error)

        return codes;
      },
    })
  }

  return (
    <Modal isOpen={isOpen} onAfterOpen={handleOpen} onRequestClose={() => setIsOpen(false)} className='rounded-lg m-4 w-auto h-auto p-0 bg-white dark:bg-[#303031] flex-row overflow-clip grow' overlayClassName="flex justify-normal items-stretch">
      <nav className='border-white/20 border-r-2 h-full bg-neutral-200 dark:bg-[#232324] flex p-14 pr-0 flex-col'>
        <p className='text-left text-sm text-gray-500 dark:text-gray-300 px-2 font-semibold'>MAIN SETTINGS</p>
        <ul className='flex flex-col gap-0.5 text-left mr-1 w-48'>
          <TabButton tab='myAccount' onClick={setPage}>My account</TabButton>
          <TabButton tab='keybinds' onClick={setPage}>Keybinds</TabButton>
          <TabButton tab='audio' onClick={setPage}>Audio</TabButton>
          <TabButton tab='codes' onClick={setPage}>Codes</TabButton>
          <TabButton tab='overlay' onClick={setPage}>Overlay</TabButton>  
        </ul>
      </nav>
      <main className='p-14 px-10 overflow-y-auto h-full inline-block w-full'>
        <Page />
      </main>
    </Modal >
  )
}
import { useCallback } from 'react';
import { useContextMenu } from 'react-contexify';
import Dropzone from 'react-dropzone';
import { IconType } from 'react-icons';
import * as icons from "react-icons/bs";
import Category from '../components/Category.tsx';
import CategoryContextMenu from '../components/contextMenus/CategoryContextMenu.tsx';
import HomeContextMenu, { HOME_CONTEXT_MENU } from '../components/contextMenus/HomeContextMenu.tsx';
import EditCategoryModal from '../components/modals/EditCategoryModal.tsx';
import EditSoundModal from '../components/modals/EditSoundModal.tsx';
import MyInstantModal from '../components/modals/MyInstantModal.tsx';
import NewCategoryModal from '../components/modals/NewCategoryModal.tsx';
import UploadModal from '../components/modals/UploadModal.tsx';
import useCategories from '../hooks/useCategories.ts';
import useModal from '../hooks/useModal.ts';

export type SoundEntry = {
  id: string,
  title: string,
  file: `${string}.${string}`,
  keybind: string,
  config: {
    volume: number
  },
  emoji?: string,
  emojiName?: string,
  category?: string
}

export type CategoryData = {
  name: string,
  expanded: boolean,
  sounds: SoundEntry[],
  icon?: IconType | keyof typeof icons
}

function Home() {
  const { open } = useModal("upload")
  const { categories, updateCategory } = useCategories();
  const { show } = useContextMenu({ id: HOME_CONTEXT_MENU })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length < 1) return;

    open({ files: acceptedFiles })
  }, [])

  return (
    <Dropzone onDrop={onDrop} noClick={true} accept={{ "audio/*": [] }}>
      {({ getRootProps, getInputProps }) => (
        <main {...getRootProps()} onContextMenu={(e) => show({ event: e })} className='h-full focus:outline-transparent mt-1'>
          <input {...getInputProps()} />

          <EditSoundModal />
          <UploadModal />
          <MyInstantModal />
          <CategoryContextMenu />
          <NewCategoryModal />
          <EditCategoryModal />
          <HomeContextMenu />
          {categories!.map((category) => <Category key={category.name} {...category} onExpandToggle={(_e, name) => { updateCategory(name, { expanded: !category.expanded }) }} />)}
          {/* <button className='flex items-center justify-center m-auto w-12 aspect-square rounded-full bg-stone-900 [&>*>svg]:text-[25px]' onClick={() => websocket.emit("stopSound")}><span><BsStopFill /></span></button> */}
        </main>
      )
      }

    </Dropzone >
  )
}

export default Home

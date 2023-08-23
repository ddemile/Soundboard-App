import { ElementRef, useContext, useRef, useCallback } from 'react'
import { BaseDirectory, writeBinaryFile } from '@tauri-apps/api/fs';
import useConfig from '../hooks/useConfig.ts';
import { BsPlus } from "react-icons/bs"
import * as icons from "react-icons/bs"
import AppContext from '../contexts/AppContext.tsx';
import ConfigModal from '../components/modals/ConfigModal.tsx';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import useLog from '../hooks/useLog.ts';
import UploadModal from '../components/modals/UploadModal.tsx';
import Category from '../components/Category.tsx';
import { IconType } from 'react-icons';
import useCategories from '../hooks/useCategories.ts';
import Dropzone from 'react-dropzone';
import useModal from '../hooks/useModal.ts';
import { useContextMenu } from 'react-contexify';
import HomeContextMenu, { HOME_CONTEXT_MENU } from '../components/contextMenus/HomeContextMenu.tsx';
import NewCategoryModal from '../components/modals/NewCategoryModal.tsx';
import CategoryContextMenu from '../components/contextMenus/CategoryContextMenu.tsx';

export type SoundEntry = {
  name: string,
  file: `${string}.${string}`,
  keybind: string,
  config: {
    volume: number
  },
  emoji?: string;
}

export type CategoryData = {
  name: string,
  expanded: boolean,
  sounds: SoundEntry[],
  icon?: IconType | keyof typeof icons
}

function Home() {
  const inputRef = useRef<ElementRef<"input">>(null)
  const { config, saveConfig } = useConfig()
  const { open } = useModal("upload")
  const log = useLog()
  const { setSounds } = useContext(AppContext)!
  const { categories, updateCategory, save } = useCategories();
  const { show } = useContextMenu({ id: HOME_CONTEXT_MENU })

  const handleUpload = async () => {
    const files = inputRef.current?.files
    if (!files) return;

    let newConfig = await config();
    for await (let file of files) {
      if (file) {
        newConfig.sounds ??= {}
        if (file.name in newConfig.sounds) return toast(`${file.name} is already in the soundboard`, { type: "error" })

        const content = await readFileContent(file)
        if (content instanceof ArrayBuffer) {
          await writeBinaryFile(file.name, content, { dir: BaseDirectory.AppCache })

          const sound = {
            name: file.name.split(".")[0],
            file: file.name,
            keybind: ""
          }

          newConfig.sounds[file.name] = sound;
          log(`${sound.name} uploaded`)
          toast(`${sound.name} uploaded`, { type: "success" })
        }
      }
    }
    if (files.length > 1) {
      toast("All sounds uploaded", {
        type: "info"
      })
    }
    setSounds(Object.values(newConfig.sounds))
    saveConfig(newConfig)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length < 1) return;

    open({ files: acceptedFiles })
  }, [])

  return (
    <Dropzone onDrop={onDrop} noClick={true} accept={{ "audio/*": [] }}>
      {({ getRootProps, getInputProps }) => (
        <main {...getRootProps()} onContextMenu={(e) => show({ event: e })} className='h-full focus:outline-transparent'>
          <input {...getInputProps()} />

          <ConfigModal />
          <UploadModal />
          <CategoryContextMenu />
          <NewCategoryModal />
          <HomeContextMenu />
          {true ?
            <>
              {categories!.map((category) => <Category key={category.name} {...category} onExpandToggle={(_e, name) => { updateCategory(name, { expanded: !category.expanded }); save() }} />)}
              {/* <button className='flex items-center justify-center m-auto w-12 aspect-square rounded-full bg-stone-900 [&>*>svg]:text-[25px]' onClick={() => websocket.emit("stopSound")}><span><BsStopFill /></span></button> */}
            </>
            :
            <div className='flex items-center justify-center'>
              <input id='upload' type="file" ref={inputRef} hidden onChange={handleUpload} multiple={true} accept='audio/*' />
              <label className='bg-stone-900 rounded-xl p-4 flex items-center gap-1' htmlFor="upload"><span className='rounded-full bg-stone-800 p-1'><BsPlus /></span><span>Add a sound</span></label>
            </div>
          }
        </main>
      )}

    </Dropzone>
  )
}

async function readFileContent(file: any): Promise<string | ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const fileContent = event.target?.result;
      if (fileContent) {
        resolve(fileContent);
      } else {
        reject()
      }

    };

    reader.readAsArrayBuffer(file);
  })
}

export default Home

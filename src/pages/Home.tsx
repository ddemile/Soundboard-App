import PlaceholderCategory from "@/components/PlaceholderCategory.tsx";
import { useCallback } from "react";
import { useCookies } from "react-cookie";
import Dropzone from "react-dropzone";
import { IconType } from "react-icons";
import * as icons from "react-icons/bs";
import { Navigate } from "react-router-dom";
import Category from "../components/Category.tsx";
import CategoryContextMenu from "../components/contextMenus/CategoryContextMenu.tsx";
import HomeContextMenu from "../components/contextMenus/HomeContextMenu.tsx";
import EditCategoryModal from "../components/modals/EditCategoryModal.tsx";
import EditSoundModal from "../components/modals/EditSoundModal.tsx";
import MyInstantModal from "../components/modals/MyInstantModal.tsx";
import NewCategoryModal from "../components/modals/NewCategoryModal.tsx";
import UploadModal from "../components/modals/UploadModal.tsx";
import useCategories from "../hooks/useCategories.ts";
import useModal from "../hooks/useModal.ts";

export type SoundEntry = {
  id: string;
  title: string;
  keybind: string;
  config: {
    volume: number;
  };
  emoji?: string;
  emojiName?: string;
  category?: string;
};

export type CategoryData = {
  name: string;
  expanded: boolean;
  sounds: SoundEntry[];
  icon?: IconType | keyof typeof icons;
};

function Home() {
  const { open } = useModal("upload");
  const { categories, updateCategory } = useCategories();
  const [cookies] = useCookies(["token"]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log("dopr");

    if (acceptedFiles.length < 1) return;

    open({ files: acceptedFiles });
  }, []);

  if (!cookies.token) return <Navigate to="/landing" />;

  return (
    <HomeContextMenu>
      <Dropzone onDrop={onDrop} noClick={true} accept={{ "audio/*": [] }}>
        {({ getRootProps, getInputProps }) => (
          <main
            {...getRootProps()}
            className="h-full focus:outline-transparent outline-hidden"
            tabIndex={-1}
          >
            <input {...getInputProps()} />

            <EditSoundModal />
            <UploadModal />
            <MyInstantModal />
            <CategoryContextMenu />
            <NewCategoryModal />
            <EditCategoryModal />
            <HomeContextMenu />
            {categories!.map((category) => (
              <Category
                key={category.name}
                {...category}
                onExpandToggle={(_e, name) => {
                  updateCategory(name, { expanded: !category.expanded });
                }}
              />
            ))}
            {categories.length == 0 && (
              <>
                <PlaceholderCategory name="Favorite" icon="BsStarFill" items={3} />
                <PlaceholderCategory name="Default" icon="BsSoundwave" items={15} />
              </>
            )}
            {/* <button className='flex items-center justify-center m-auto w-12 aspect-square rounded-full bg-stone-900 [&>*>svg]:text-[25px]' onClick={() => websocket.emit("stopSound")}><span><BsStopFill /></span></button> */}
          </main>
        )}
      </Dropzone>
    </HomeContextMenu>
  );
}

export default Home;

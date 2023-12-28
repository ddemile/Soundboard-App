import { Item, ItemParams, Menu, Separator, Submenu } from 'react-contexify';
import useCategories, { useCategoriesStore } from "../../hooks/useCategories.ts";
import useModal from '../../hooks/useModal.ts';
import { CategoryData, SoundEntry } from "../../pages/Home.tsx";

export default function SoundContextMenu() {
  const { categories, deleteSound } = useCategories()
  const { addSound, removeSound } = useCategoriesStore();
  const { open } = useModal("config")

  const handleMove = ({ props }: ItemParams<{ sound: SoundEntry, category: CategoryData }>, newCategory: CategoryData) => {
    if (!props) return;
    const { sound, category } = props

    removeSound(sound.title, category.name)
    addSound(sound, newCategory.name)
  }

  return (
    <Menu id={SOUND_CONTEXT_MENU} theme='dark'>
      <Item onClick={({ props }) => open(props)}>
        Edit sound
      </Item>
      <Item disabled>
        Download sound
      </Item>
      <Separator />
      <Submenu label="Move to">
        {categories.map(category => <Item onClick={(args) => handleMove(args, category)} key={category.name}>{category.name}</Item>)}
      </Submenu>
      <Separator />
      <Item onClick={({ props: { sound } }) => { deleteSound(sound.id); }}>
        Delete sound
      </Item>
    </Menu>
  )
}

export const SOUND_CONTEXT_MENU = "sound_context_menu";
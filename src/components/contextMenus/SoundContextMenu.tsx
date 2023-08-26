import { Item, ItemParams, Menu, Separator, Submenu } from 'react-contexify';
import useCategories from "../../hooks/useCategories.ts";
import useModal from '../../hooks/useModal.ts';
import { CategoryData, SoundEntry } from "../../pages/Home.tsx";

export default function SoundContextMenu() {
  const { categories, addSound, removeSound, save } = useCategories()
  const { open } = useModal("config")

  const handleMove = ({ props }: ItemParams<{ sound: SoundEntry, category: CategoryData }>, newCategory: CategoryData) => {
    if (!props) return;
    const { sound, category } = props

    removeSound(sound.name, category.name)
    addSound(sound, newCategory.name)
    save()
  }

  return (
    <Menu id={SOUND_CONTEXT_MENU} theme='dark'>
      <Item onClick={({ props }) => open(props)}>
        Modifier le son
      </Item>
      <Item disabled>
        Télécharger le son
      </Item>
      <Separator />
      <Submenu label="Move to">
        {categories.map(category => <Item onClick={(args) => handleMove(args, category)} key={category.name}>{category.name}</Item>)}
      </Submenu>
      <Separator />
      <Item onClick={({ props: { sound, category } }) => { removeSound(sound.name, category.name); save() }}>
        Supprimer le son
      </Item>
    </Menu>
  )
}

export const SOUND_CONTEXT_MENU = "sound_context_menu";
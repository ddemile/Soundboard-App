import { Item, Menu, Separator } from 'react-contexify';
import useCategories from '../../hooks/useCategories.ts';
import useConfig from '../../hooks/useConfig.ts';
import useModal from '../../hooks/useModal.ts';

export default function CategoryContextMenu() {
  const { open } = useModal("edit-category")
  const { deleteCategory } = useCategories()
  const { saveConfig } = useConfig()

  return (
    <Menu id={CATEGORY_CONTEXT_MENU} theme='dark'>
      <Item onClick={open} disabled>
        Edit category
      </Item>
      <Separator />
      <Item onClick={({ props }) => { deleteCategory(props.name); saveConfig() }} disabled={({ props }) => ["Default", "Favorite"].includes(props.name)}>
        Delete category
      </Item>
    </Menu>
  )
}

export const CATEGORY_CONTEXT_MENU = "category_context_menu";
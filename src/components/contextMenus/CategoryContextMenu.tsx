import { Menu, Item, Separator } from 'react-contexify';
import useModal from '../../hooks/useModal.ts';
import useCategories from '../../hooks/useCategories.ts';

export default function CategoryContextMenu() {
  const { open } = useModal("edit-category")
  const { deleteCategory, save } = useCategories()

  return (
    <Menu id={CATEGORY_CONTEXT_MENU} theme='dark'>
      <Item onClick={open} disabled>
        Edit category
      </Item>
      <Separator />
      <Item onClick={({ props }) => { deleteCategory(props.name); save() }} disabled={({ props }) => ["Default", "Favorite"].includes(props.name)}>
        Delete category
      </Item>
    </Menu>
  )
}

export const CATEGORY_CONTEXT_MENU = "category_context_menu";
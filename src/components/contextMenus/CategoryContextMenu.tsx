import { Item, Menu, Separator } from 'react-contexify';
import { useConfirm } from '../../contexts/ConfirmContext.tsx';
import useCategories from '../../hooks/useCategories.ts';
import useModal from '../../hooks/useModal.ts';
import useSystemTheme from '../../hooks/useSystemTheme.ts';

export default function CategoryContextMenu() {
  const { open } = useModal("edit-category")
  const { deleteCategory } = useCategories()
  const { confirm } = useConfirm()
  const theme = useSystemTheme()

  const handleDelete = async (categoryName: string) => {
    if (await confirm({ title: `Delete ${categoryName} ?`, subtitle: "You will not be able to undo this action." })) {
      deleteCategory(categoryName)
    }
  }

  return (
    <Menu id={CATEGORY_CONTEXT_MENU} theme={theme}>
      <Item onClick={({ props }) => open(props)} disabled={({ props }) => ["Default", "Favorite"].includes(props.name)}>
        Edit category
      </Item>
      <Separator />
      <Item onClick={({ props }) => handleDelete(props.name)} disabled={({ props }) => ["Default", "Favorite"].includes(props.name)}>
        Delete category
      </Item>
    </Menu>
  )
}

export const CATEGORY_CONTEXT_MENU = "category_context_menu";
import { Item, Menu } from 'react-contexify';
import useModal from '../../hooks/useModal.ts';

export default function HomeContextMenu() {
  const { open } = useModal("new-category")

  return (
    <Menu id={HOME_CONTEXT_MENU} theme='dark'>
      <Item onClick={open}>
        New category
      </Item>
    </Menu>
  )
}

export const HOME_CONTEXT_MENU = "home_context_menu";
import { Item, Menu } from 'react-contexify';
import useModal from '../../hooks/useModal.ts';
import useSystemTheme from '../../hooks/useSystemTheme.ts';

export default function HomeContextMenu() {
  const { open } = useModal("new-category")
  const theme = useSystemTheme()

  return (
    <Menu id={HOME_CONTEXT_MENU} theme={theme}>
      <Item onClick={open}>
        New category
      </Item>
    </Menu>
  )
}

export const HOME_CONTEXT_MENU = "home_context_menu";
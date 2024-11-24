import { PropsWithChildren } from 'react';
import useModal from '../../hooks/useModal.ts';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../ui/context-menu.tsx';

export default function HomeContextMenu({ children }: PropsWithChildren) {
  const { open } = useModal("new-category")

  return (
    <ContextMenu>
      <ContextMenuTrigger className='h-full p-0 mt-1'>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className='w-64'>
        <ContextMenuItem onClick={open}>New category</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
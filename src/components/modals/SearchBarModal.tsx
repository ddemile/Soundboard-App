import useModal from "@/hooks/useModal.ts";
import ReactModal from "react-modal";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import AppContext from "@/contexts/AppContext.tsx";
import useCategories from "@/hooks/useCategories.ts";
import { KeyboardEventHandler, MouseEventHandler, useContext } from "react";

export default function SearchBarModal() {
  const { isOpen, setIsOpen } = useModal("searchBar");
  const { categories } = useCategories();
  const { play } = useContext(AppContext)!

  const handleEvent: MouseEventHandler = (event) => {
    let value: string | null = null;
    if (event.target instanceof HTMLDivElement && event.target.hasAttribute("cmdk-item")) {
      value = event.target.dataset.value!
    } else if (event.target instanceof HTMLSpanElement && event.target.parentElement?.hasAttribute("cmdk-item")) {
      value = event.target.parentElement?.dataset.value!
    }

    if (!value) return;

    categories.forEach((category) => {
      const sound = category.sounds.find(sound => `${sound.emoji ?? "🎵"}${sound.title}` == value)

      if (sound) play(sound)
    })
  }

  const handleKeyPressed: KeyboardEventHandler = (event) => {
    if (event.key != "Enter") return

    const target = document.querySelector('div[aria-selected="true"]') as HTMLDivElement

    if (!target || !target.hasAttribute("cmdk-item")) return;

    let value: string | undefined = target.dataset.value;

    categories.forEach((category) => {
      const sound = category.sounds.find(sound => `${sound.emoji ?? "🎵"}${sound.title}` == value)

      if (sound) play(sound)
    })
  }

  return (
    <ReactModal
      isOpen={isOpen}
      closeTimeoutMS={200}
      onRequestClose={() => setIsOpen(false)}
      className="flex justify-center flex-col outline-non"
      overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/30 flex justify-center items-center"
    >
      <Command className="rounded-lg border shadow-md md:min-w-[450px]" onClick={handleEvent} onKeyDown={handleKeyPressed}>
        <CommandInput placeholder="Type a command or search..." autoFocus />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {categories.filter(cateogry => cateogry.sounds.length > 0).map((category) => (
            <CommandGroup heading={category.name} key={category.name}>
              {category.sounds.map((sound) => (
                <CommandItem className="cursor-pointer" id={`sound-${sound.title}`} key={sound.title}>
                  <span>{sound.emoji ?? "🎵"}</span>
                  <span>{sound.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </ReactModal>
  );
}

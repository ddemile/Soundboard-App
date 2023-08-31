import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import IconSelector from "../components/IconSelector.tsx";

export default function Discover() {
  return (
    <div className="flex">
      <IconSelector />
      <EmojiPicker skinTonesDisabled emojiStyle={EmojiStyle.GOOGLE} theme={Theme.DARK} onEmojiClick={(emoji) => console.log(emoji)} />
    </div>
  )
}

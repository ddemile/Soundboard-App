import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import IconSelector from "../components/IconSelector.tsx";
import useAudioPlayer from "../hooks/useAudioPlayer.ts";

export default function Discover() {
  const player = useAudioPlayer()

  return (
    <div className="flex">
      <IconSelector />
      <EmojiPicker skinTonesDisabled emojiStyle={EmojiStyle.GOOGLE} theme={Theme.DARK} onEmojiClick={(emoji) => console.log(emoji)} />
      <button onClick={() => player.play({ id: "name", volume: 10, url: "https://www.myinstants.com/media/sounds/run-vine-sound-effect.mp3" })}>Play</button>
      <button onClick={() => player.play({ id: "named", url: "https://www.myinstants.com/media/sounds/tmp_7901-951678082.mp3" })}>Play</button>
      <button onClick={() => player.stop()}>Play/Pause</button>
    </div>
  )
}

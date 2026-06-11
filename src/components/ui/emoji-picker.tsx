"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Smile } from "lucide-react";

const emojiGroups: { name: string; emojis: string[] }[] = [
  {
    name: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂",
      "😉", "😌", "😍", "🥰", "😘", "😗", "😋", "😛", "😜", "🤪",
      "😝", "🤑", "🤗", "🤭", "🫢", "🫣", "🤫", "🤔", "😐", "😑",
      "😶", "😏", "😒", "🙄", "😬", "😮", "😯", "😲", "😳", "🥺",
      "😢", "😭", "😤", "😡", "🤬", "😈", "👿", "💀", "☠️", "💩",
    ],
  },
  {
    name: "Gestures",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫶", "👌", "🤌", "🤏", "✌️",
      "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇",
      "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐",
      "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦵", "🦶", "👂",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "💼", "📁", "📂", "🗂️", "📅", "📆", "📋", "📌", "📍", "📎",
      "✂️", "🔒", "🔓", "🔐", "🔑", "🗝️", "🔔", "🔕", "🎁", "🎀",
      "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "💾", "📀", "💿",
      "📷", "📸", "📹", "🎥", "📞", "☎️", "📟", "📠", "🔋", "💳",
    ],
  },
  {
    name: "Symbols",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "✔️",
      "✅", "❌", "❎", "⭐", "🌟", "✨", "💫", "🔥", "💯", "🎯",
      "🚩", "🎌", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "📢", "📣",
    ],
  },
  {
    name: "Nature",
    emojis: [
      "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️",
      "❄️", "☃️", "⛄", "🔥", "💧", "🌊", "🌈", "🌍", "🌎", "🌏",
      "🌻", "🌹", "🌸", "🌺", "🌷", "🌿", "🍀", "🌱", "🍃", "🍂",
    ],
  },
  {
    name: "Food",
    emojis: [
      "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈",
      "🍒", "🍑", "🥭", "🍍", "🥝", "🍅", "🥑", "🥦", "🥬", "🥒",
      "🌽", "🥕", "🧄", "🧅", "🥔", "🍞", "🥖", "🥯", "🧀", "🥚",
      "🍳", "🥞", "🧇", "🥓", "🍔", "🌭", "🍕", "🥪", "🌮", "🌯",
    ],
  },
  {
    name: "Activities",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
      "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳",
      "🎯", "🛝", "🎣", "🤿", "🥊", "🥋", "🎮", "🕹️", "🎲", "♠️",
    ],
  },
  {
    name: "Travel",
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐",
      "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🛹", "🚏", "🛣️",
      "✈️", "🛩️", "🛫", "🛬", "🚀", "🛸", "🚁", "🛶", "⛵", "🚤",
    ],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(emojiGroups[0].name);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          title="Insert emoji"
        >
          <Smile className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-[320px] p-0">
        <div className="flex gap-1 p-2 border-b border-gray-100 overflow-x-auto">
          {emojiGroups.map((group) => (
            <button
              key={group.name}
              type="button"
              onClick={() => setActiveGroup(group.name)}
              className={`text-lg p-1 rounded hover:bg-gray-100 shrink-0 transition-colors ${
                activeGroup === group.name ? "bg-indigo-100 ring-1 ring-indigo-300" : ""
              }`}
              title={group.name}
            >
              {group.emojis[0]}
            </button>
          ))}
        </div>
        <ScrollArea className="h-[220px] p-2">
          <div className="grid grid-cols-10 gap-0.5">
            {emojiGroups
              .find((g) => g.name === activeGroup)
              ?.emojis.map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  type="button"
                  onClick={() => {
                    onSelect(emoji);
                    setOpen(false);
                  }}
                  className="text-lg p-1 rounded hover:bg-gray-100 hover:scale-110 transition-all"
                >
                  {emoji}
                </button>
              ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

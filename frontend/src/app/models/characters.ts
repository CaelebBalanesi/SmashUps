export interface Character {
  name: string;
  icon: string;
}

export const characters: Character[] = [
  { name: "Mario", icon: "stock-icons/mario.png" },
  { name: "Link", icon: "stock-icons/link.png" },
  { name: "Samus", icon: "stock-icons/samus.png" },
  { name: "Pikachu", icon: "stock-icons/pikachu.png" },
  { name: "Kirby", icon: "stock-icons/kirby.png" },
];

export function getCharacterByName(name: string): Character | undefined {
  return characters.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Character } from "../../models/characters";

@Component({
  selector: "app-character-select",
  imports: [FormsModule],
  templateUrl: "./character-select.html",
  styleUrl: "./character-select.scss",
})
export class CharacterSelectComponent {
  @Input() characters: Character[] = [];
  @Output() selected = new EventEmitter<Character>();

  searchTerm = "";
  dropdownOpen = false;

  filteredCharacters(): Character[] {
    const term = this.searchTerm.toLowerCase();
    return this.characters.filter((c) => c.name.toLowerCase().includes(term));
  }

  selectCharacter(char: Character) {
    this.selected.emit(char);
    this.searchTerm = "";
    this.dropdownOpen = false;
  }

  closeDropdown() {
    setTimeout(() => (this.dropdownOpen = false), 150);
  }
}

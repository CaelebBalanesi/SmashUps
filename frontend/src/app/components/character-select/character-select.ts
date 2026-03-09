import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Select, SelectChangeEvent } from "primeng/select";
import { Character } from "../../models/characters";

@Component({
  selector: "app-character-select",
  imports: [FormsModule, Select],
  templateUrl: "./character-select.html",
  styleUrl: "./character-select.scss",
})
export class CharacterSelectComponent {
  @Input() characters: Character[] = [];
  @Output() selected = new EventEmitter<Character>();

  selectedChar: Character | null = null;

  onSelect(event: SelectChangeEvent) {
    if (event.value) {
      this.selected.emit(event.value);
      setTimeout(() => {
        this.selectedChar = null;
      }, 0);
    }
  }
}

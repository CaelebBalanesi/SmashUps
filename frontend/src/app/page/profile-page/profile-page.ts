import { Component } from "@angular/core";
import { Api, User } from "../../services/api";
import { HttpClient } from "@angular/common/http";
import { Character, characters } from "../../models/characters";
import { FormsModule } from "@angular/forms";
import { CharacterSelectComponent } from "../../components/character-select/character-select";

@Component({
  selector: "app-profile-page",
  standalone: true,
  imports: [FormsModule, CharacterSelectComponent],
  templateUrl: "./profile-page.html",
  styleUrls: ["./profile-page.scss"],
})
export class ProfilePage {
  selectedMain: Character | null = null;
  user: User | null = null;
  saving = false;
  message = "";
  characters: Character[] = characters;
  searchTerm = "";
  dropdownOpen = false;

  constructor(
    private api: Api,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.api.user$.subscribe((user) => {
      this.user = user;
      this.selectedMain = user?.main
        ? this.characters.find((c) => c.name === user.main) || null
        : null;
      this.searchTerm = this.selectedMain?.name || "";
    });
  }

  filteredCharacters(): Character[] {
    const term = this.searchTerm.toLowerCase();
    return this.characters.filter((c) => c.name.toLowerCase().includes(term));
  }

  selectMain(character: Character) {
    this.selectedMain = character;
    this.searchTerm = character.name;
    this.dropdownOpen = false;
  }

  closeDropdown() {
    setTimeout(() => (this.dropdownOpen = false), 150);
  }

  saveMain() {
    if (!this.selectedMain) return;
    this.saving = true;
    this.message = "";

    this.api.setMain(this.selectedMain.name).subscribe({
      next: (user) => {
        this.message = "Saved main successfully!";
        console.log("Main updated:", user);
        this.saving = false;
      },
      error: (err) => {
        this.message = "Error saving main. Try again later!";
        console.error("Error:", err);
        this.saving = false;
      },
    });
  }

  loginWithDiscord() {
    window.location.href = "http://localhost:3000/auth/discord";
  }
}

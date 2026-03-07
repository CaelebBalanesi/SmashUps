import { Component } from "@angular/core";
import { Api, User } from "../../services/api";
import { Character, characters } from "../../models/characters";
import { CharacterSelectComponent } from "../../components/character-select/character-select";

@Component({
  selector: "app-profile-page",
  imports: [CharacterSelectComponent],
  templateUrl: "./profile-page.html",
  styleUrl: "./profile-page.scss",
})
export class ProfilePage {
  selectedMain: Character | null = null;
  user: User | null = null;
  saving = false;
  message = "";
  characters: Character[] = characters;

  constructor(private api: Api) {}

  ngOnInit() {
    this.api.user$.subscribe((user) => {
      this.user = user;
      this.selectedMain = user?.main
        ? this.characters.find((c) => c.name === user.main) || null
        : null;
    });
  }

  selectMain(character: Character) {
    this.selectedMain = character;
  }

  saveMain() {
    if (!this.selectedMain) return;
    this.saving = true;
    this.message = "";

    this.api.setMain(this.selectedMain.name).subscribe({
      next: () => {
        this.message = "Saved main successfully!";
        this.saving = false;
      },
      error: () => {
        this.message = "Error saving main. Try again later!";
        this.saving = false;
      },
    });
  }

  loginWithDiscord() {
    window.location.href = "http://localhost:3000/auth/discord";
  }
}

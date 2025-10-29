import { Component } from "@angular/core";
import { Api } from "../../services/api";
import { HttpClient } from "@angular/common/http";
import { Character, characters } from "../../models/characters";

@Component({
  selector: "app-profile-page",
  imports: [],
  templateUrl: "./profile-page.html",
  styleUrl: "./profile-page.scss",
})
export class ProfilePage {
  selectedMain: Character | null = null;
  user: any = null;
  saving = false;
  message = "";
  characters: Character[] = characters;

  constructor(
    private api: Api,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.api.user$.subscribe((user) => {
      this.user = user;
      this.selectedMain = user?.main
        ? characters.find((c) => c.name === user.main) || null
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
      next: (user) => console.log("Main updated:", user),
      error: (err) => console.error("Error:", err),
    });
  }
}

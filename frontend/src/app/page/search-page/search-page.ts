import { Component } from "@angular/core";
import { Character, characters } from "../../models/characters";
import { CharacterSelectComponent } from "../../components/character-select/character-select";
import { Api, MatchOpponent } from "../../services/api";

@Component({
  selector: "app-search-page",
  imports: [CharacterSelectComponent],
  templateUrl: "./search-page.html",
  styleUrl: "./search-page.scss",
})
export class SearchPage {
  characters: Character[] = characters;
  selectedCharacters: Character[] = [];
  match: MatchOpponent | null = null;
  searching = false;
  searchMessage = "";
  userMain: string | null = null;
  messageType = "message";

  constructor(private api: Api) {
    this.api.match$.subscribe((match) => (this.match = match));
    this.api.searching$.subscribe(
      (isSearching) => (this.searching = isSearching),
    );
    this.api.searchMessage$.subscribe((msg) => (this.searchMessage = msg));

    this.api.user$.subscribe((user) => {
      this.userMain = user?.main ?? null;
    });
  }

  addCharacter(char: Character) {
    if (!this.selectedCharacters.find((c) => c.name === char.name)) {
      this.selectedCharacters.push(char);
    }
  }

  removeCharacter(index: number) {
    if (this.searching) {
      const temp_message = this.searchMessage;
      this.searchMessage = "You cannot remove characters while searching!";
      this.messageType = "error-message";
      setInterval(() => {
        this.searchMessage = temp_message;
        this.messageType = "message";
      }, 3000);
      return;
    }
    this.selectedCharacters.splice(index, 1);
  }

  startSearch() {
    if (!this.userMain) {
      alert("Please set your main character in your profile first!");
      return;
    }

    const lookingFor = this.selectedCharacters.map((c) => c.name);
    console.log("Starting search:", this.userMain, lookingFor);
    this.api.startSearch(this.userMain, lookingFor);
  }

  stopSearch() {
    this.api.stopSearch();
  }

  getAvatarUrl(user: MatchOpponent) {
    return user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : "https://cdn.discordapp.com/embed/avatars/0.png";
  }

  openDiscordProfile(id: string) {
    window.open(`https://discord.com/users/${id}`, "_blank");
  }
}

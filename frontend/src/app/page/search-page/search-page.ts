import { Component } from "@angular/core";
import { Character, characters, getCharacterByName } from "../../models/characters";
import { CharacterSelectComponent } from "../../components/character-select/character-select";
import { Api, MatchOpponent } from "../../services/api";
import { MessageService } from "primeng/api";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { Chip } from "primeng/chip";
import { ProgressSpinner } from "primeng/progressspinner";
import { Message } from "primeng/message";
import { Avatar } from "primeng/avatar";

@Component({
  selector: "app-search-page",
  imports: [CharacterSelectComponent, Card, Button, Chip, ProgressSpinner, Message, Avatar],
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

  constructor(
    private api: Api,
    private messageService: MessageService,
  ) {
    this.api.match$.subscribe((match) => (this.match = match));
    this.api.searching$.subscribe((isSearching) => (this.searching = isSearching));
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
      this.messageService.add({
        severity: "warn",
        summary: "Searching",
        detail: "Cannot remove characters while searching.",
        life: 3000,
      });
      return;
    }
    this.selectedCharacters.splice(index, 1);
  }

  startSearch() {
    if (!this.userMain) {
      this.messageService.add({
        severity: "warn",
        summary: "No Main Set",
        detail: "Please set your main character in your profile first.",
        life: 4000,
      });
      return;
    }
    const lookingFor = this.selectedCharacters.map((c) => c.name);
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

  getMainIcon(name: string): string {
    return getCharacterByName(name)?.icon ?? "";
  }

  openDiscordProfile(id: string) {
    window.open(`https://discord.com/users/${id}`, "_blank");
  }
}

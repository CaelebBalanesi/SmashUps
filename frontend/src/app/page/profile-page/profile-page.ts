import { Component, OnInit } from "@angular/core";
import { Api, User } from "../../services/api";
import { Character, characters } from "../../models/characters";
import { CharacterSelectComponent } from "../../components/character-select/character-select";
import { MessageService } from "primeng/api";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { Avatar } from "primeng/avatar";

@Component({
  selector: "app-profile-page",
  imports: [CharacterSelectComponent, Card, Button, Avatar],
  templateUrl: "./profile-page.html",
  styleUrl: "./profile-page.scss",
})
export class ProfilePage implements OnInit {
  selectedMain: Character | null = null;
  user: User | null = null;
  saving = false;
  characters: Character[] = characters;

  constructor(
    private api: Api,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    this.api.user$.subscribe((user) => {
      this.user = user;
      this.selectedMain = user?.main
        ? this.characters.find((c) => c.name === user.main) || null
        : null;
    });
  }

  get avatarUrl(): string {
    if (!this.user) return "";
    return `https://cdn.discordapp.com/avatars/${this.user.discordId}/${this.user.avatar}.png`;
  }

  selectMain(character: Character) {
    this.selectedMain = character;
  }

  saveMain() {
    if (!this.selectedMain) return;
    this.saving = true;

    this.api.setMain(this.selectedMain.name).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({
          severity: "success",
          summary: "Saved!",
          detail: "Your main character has been updated.",
          life: 3000,
        });
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to save. Please try again.",
          life: 3000,
        });
      },
    });
  }

  loginWithDiscord() {
    window.location.href = "http://localhost:3000/auth/discord";
  }
}

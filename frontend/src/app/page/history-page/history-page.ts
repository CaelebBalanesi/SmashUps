import { Component, OnInit } from "@angular/core";
import { Api, MatchHistoryEntry, User } from "../../services/api";
import { getCharacterByName } from "../../models/characters";
import { Avatar } from "primeng/avatar";
import { Card } from "primeng/card";
import { ProgressSpinner } from "primeng/progressspinner";
import { Message } from "primeng/message";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-history-page",
  imports: [Avatar, Card, ProgressSpinner, Message, RouterLink],
  templateUrl: "./history-page.html",
  styleUrl: "./history-page.scss",
})
export class HistoryPage implements OnInit {
  user: User | null = null;
  history: MatchHistoryEntry[] = [];
  loading = true;

  constructor(private api: Api) {}

  ngOnInit() {
    this.api.user$.subscribe((user) => {
      this.user = user;
      if (user) {
        this.api.getMatchHistory().subscribe({
          next: (entries) => {
            this.history = entries;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          },
        });
      } else {
        this.loading = false;
      }
    });
  }

  getAvatarUrl(discordId: string, avatar?: string): string {
    if (!avatar) return "https://cdn.discordapp.com/embed/avatars/0.png";
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`;
  }

  getMainIcon(name: string): string {
    return getCharacterByName(name)?.icon ?? "";
  }

  formatDate(matchedAt: number): string {
    return new Date(Number(matchedAt)).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  openDiscordProfile(discordId: string) {
    window.open(`https://discord.com/users/${discordId}`, "_blank");
  }
}

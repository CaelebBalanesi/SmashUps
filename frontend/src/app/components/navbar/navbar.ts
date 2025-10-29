import { Component, OnInit } from "@angular/core";
import { Api } from "../../services/api";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-navbar",
  imports: [RouterLink],
  templateUrl: "./navbar.html",
  styleUrl: "./navbar.scss",
})
export class Navbar {
  user: any = null;

  constructor(private api: Api) {}

  ngOnInit() {
    this.api.user$.subscribe((user) => {
      this.user = user;
    });
  }

  loginWithDiscord() {
    window.location.href = "http://localhost:3000/auth/discord";
  }

  logout() {
    this.api.clearUser();
  }

  get avatarUrl(): string {
    if (!this.user) return "";
    return `https://cdn.discordapp.com/avatars/${this.user.id}/${this.user.avatar}.png`;
  }
}

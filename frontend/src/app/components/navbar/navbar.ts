import { Component, OnInit } from "@angular/core";
import { Api, User } from "../../services/api";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-navbar",
  imports: [RouterLink],
  templateUrl: "./navbar.html",
  styleUrl: "./navbar.scss",
})
export class Navbar {
  user: User | null = null;

  constructor(private api: Api) {}

  ngOnInit() {
    this.api.user$.subscribe((user) => {
      console.log(user);
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
    // console.log(`${this.user.discordId}/${this.user.avatar}`);
    return `https://cdn.discordapp.com/avatars/${this.user.discordId}/${this.user.avatar}.png`;
  }
}

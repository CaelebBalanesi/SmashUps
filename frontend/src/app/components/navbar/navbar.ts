import { Component, OnInit } from "@angular/core";
import { Api, User } from "../../services/api";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { Toolbar } from "primeng/toolbar";
import { Button } from "primeng/button";
import { Avatar } from "primeng/avatar";

@Component({
  selector: "app-navbar",
  imports: [RouterLink, RouterLinkActive, Toolbar, Button, Avatar],
  templateUrl: "./navbar.html",
  styleUrl: "./navbar.scss",
})
export class Navbar implements OnInit {
  user: User | null = null;

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
    return `https://cdn.discordapp.com/avatars/${this.user.discordId}/${this.user.avatar}.png`;
  }
}

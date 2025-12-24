import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

interface Character {
  name: string;
  icon: string;
}

@Component({
  selector: "app-home-page",
  imports: [],
  templateUrl: "./home-page.html",
  styleUrl: "./home-page.scss",
})
export class HomePage {
  constructor(private router: Router) {}

  goToMatchupSearch(): void {
    this.router.navigate(["/search"]);
  }
}

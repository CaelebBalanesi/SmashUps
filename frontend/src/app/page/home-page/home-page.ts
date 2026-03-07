import { Component } from "@angular/core";
import { Router } from "@angular/router";

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

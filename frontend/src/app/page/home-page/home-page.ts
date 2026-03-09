import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { Button } from "primeng/button";

@Component({
  selector: "app-home-page",
  imports: [Button],
  templateUrl: "./home-page.html",
  styleUrl: "./home-page.scss",
})
export class HomePage {
  constructor(private router: Router) {}

  goToMatchupSearch(): void {
    this.router.navigate(["/search"]);
  }
}

import { Component, OnInit } from "@angular/core";

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
export class HomePage {}

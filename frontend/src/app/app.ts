import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Navbar } from "./components/navbar/navbar";
import { Toast } from "primeng/toast";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, Navbar, Toast],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App {}

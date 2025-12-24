import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Api } from "../../services/api";

@Component({
  selector: "app-authorization-page",
  imports: [],
  templateUrl: "./authorization-page.html",
  styleUrl: "./authorization-page.scss",
})
export class AuthorizationPage {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: Api,
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const token = params.get("token");
      if (token) {
        this.api.setToken(token);
        this.router.navigate(["/home"]);
      }
    });
  }
}

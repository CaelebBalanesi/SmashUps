import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

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
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const token = params.get("token");
      console.log(token);
      if (token) {
        localStorage.setItem("jwt", token);
        this.router.navigate(["/home"]);
      }
    });
  }
}

import { Routes } from "@angular/router";
import { AuthorizationPage } from "./page/authorization/authorization-page";
import { HomePage } from "./page/home-page/home-page";
import { ProfilePage } from "./page/profile-page/profile-page";

export const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  { path: "home", component: HomePage },
  { path: "auth_success", component: AuthorizationPage },
  { path: "profile", component: ProfilePage },
];

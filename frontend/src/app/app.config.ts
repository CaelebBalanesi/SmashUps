import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { authInterceptor } from "./interceptors/auth-interceptor";
import { provideAnimations } from "@angular/platform-browser/animations";
import { providePrimeNG } from "primeng/config";
import { definePreset } from "@primeng/themes";
import Aura from "@primeng/themes/aura";
import { MessageService } from "primeng/api";

const SmashUpsPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "#fdf4ff",
      100: "#fbe8ff",
      200: "#f5caff",
      300: "#eeaaff",
      400: "#e082ff",
      500: "#d96cff",
      600: "#c44ee6",
      700: "#a033c9",
      800: "#8025ad",
      900: "#651a8f",
      950: "#450f70",
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    MessageService,
    providePrimeNG({
      theme: {
        preset: SmashUpsPreset,
        options: {
          darkModeSelector: ".p-dark",
        },
      },
      ripple: true,
    }),
  ],
};

import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';

// Register Arabic locale data
registerLocaleData(localeAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Set Arabic as the default locale
    { provide: LOCALE_ID, useValue: 'ar' },
    // Enable hydration only for production SSR builds to avoid NG0505 in dev/CSR
    ...(process.env['NODE_ENV'] === 'production' ? [provideClientHydration()] : [])
  ]
};

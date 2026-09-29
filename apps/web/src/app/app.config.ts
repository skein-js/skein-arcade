import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideJsonRender } from '@ng-json-render/core';
import { appRoutes } from './app.routes';
import { arcadeRegistry } from './catalog/arcade.registry';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(),
    provideJsonRender({
      registry: arcadeRegistry,
    }),
  ],
};

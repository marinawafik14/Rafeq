import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { ReactiveFormsModule } from '@angular/forms';

// ⬇ Import JwtModule and JwtHelperService
import { JwtModule } from '@auth0/angular-jwt';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from './environments/environment';
export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
   provideAnimations(),
      provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
      // ✅ Provide JwtHelperService via importProvidersFrom
    importProvidersFrom(
      JwtModule.forRoot({})
    ),

    // ✅ Manually provide JwtHelperService if needed
    {
      provide: JwtHelperService,
      useValue: new JwtHelperService()
    }

  ]
};

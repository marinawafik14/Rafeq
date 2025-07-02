
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../Services/auth.service';

export const authGuardGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser.pipe(
    map(user => {
      if (user && user.accessToken) {
        const requiredRoles = route.data['roles'] as Array<string>;
        if (requiredRoles && requiredRoles.length) {
          if (!requiredRoles.includes(user.role)) {
            router.navigate(['/NotFound']);
            return false;
          }
        }
        return true;
      }

      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};

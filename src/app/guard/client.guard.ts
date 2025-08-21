import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {AuthService} from "../services/auth.service";

export const clientGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const isAuthenticated = await authService.initializeAuth();

    if (!isAuthenticated) {
      router.navigate(['/login']);
      return false;
    }

    if (!authService.isClient()) {
      authService.redirectBasedOnRole();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification des droits client:', error);
    router.navigate(['/login']);
    return false;
  }
};

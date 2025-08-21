import { CanActivateFn, Router } from '@angular/router';
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  try {
    const isAuthenticated = await auth.initializeAuth();

    if (!isAuthenticated) {
      router.navigateByUrl('/login');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    router.navigateByUrl('/login');
    return false;
  }
};

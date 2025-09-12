import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const employeeGuard: CanActivateFn = (route, state) => {

const authService = inject(AuthService);
  const router = inject(Router);

 // Vérifier si l'utilisateur est connecté
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }


// Vérifier si l'utilisateur a le rôle employé
  if (!authService.isEmployee()) {
    // Rediriger vers la page appropriée selon le rôle
    authService.redirectBasedOnRole();
    return false;
  }



  return true;
};

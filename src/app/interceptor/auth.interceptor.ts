import { HttpHeaders, HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from "../services/auth.service";
import { inject } from "@angular/core";
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();

  // Ajouter le token si disponible
  let newReq = req;
  if (token) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    newReq = req.clone({
      headers
    });
  }

  return next(newReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si erreur 401, rediriger vers login et nettoyer le token
      if (error.status === 401) {
        auth.removeToken();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

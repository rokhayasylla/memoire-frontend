import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import { BehaviorSubject, Observable, tap, catchError, throwError, of } from "rxjs";
import { AuthResponse, LoginRequest, RegisterRequest, User } from "../models/user";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.ApiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isInitialized = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Ne pas vérifier le token au démarrage automatiquement
  }

  // Méthode pour initialiser l'authentification
  initializeAuth(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isInitialized) {
        resolve(!!this.getCurrentUserValue());
        return;
      }

      const token = this.getToken();
      if (!token) {
        this.isInitialized = true;
        resolve(false);
        return;
      }

      // Vérifier si le token n'est pas expiré
      if (!this.isTokenValid(token)) {
        this.removeToken();
        this.isInitialized = true;
        resolve(false);
        return;
      }

      // Récupérer les infos utilisateur
      this.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
          this.isInitialized = true;
          resolve(true);
        },
        error: () => {
          this.removeToken();
          this.isInitialized = true;
          resolve(false);
        }
      });
    });
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  private handleAuthError(): void {
    this.removeToken();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.saveToken(response.token);
          this.currentUserSubject.next(response.user);
          this.isInitialized = true;
        }),
        catchError(this.handleError)
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data)
      .pipe(
        tap(response => {
          this.saveToken(response.token);
          this.currentUserSubject.next(response.user);
          this.isInitialized = true;
        }),
        catchError(this.handleError)
      );
  }

  logout(): Observable<any> {
    // Créer un observable qui se complete même si l'API échoue
    const logoutRequest = this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
      catchError(() => of(null)) // Ignorer les erreurs de l'API
    );

    return logoutRequest.pipe(
      tap(() => {
        this.handleLogout();
      })
    );
  }

  private handleLogout(): void {
    this.removeToken();
    this.currentUserSubject.next(null);
    this.isInitialized = false;
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`)
      .pipe(
        catchError((error) => {
          if (error.status === 401) {
            this.removeToken();
            this.currentUserSubject.next(null);
          }
          return throwError(() => error);
        })
      );
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, {})
      .pipe(
        tap(response => {
          this.saveToken(response.token);
          this.currentUserSubject.next(response.user);
        }),
        catchError((error) => {
          this.handleAuthError();
          return throwError(() => error);
        })
      );
  }

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  removeToken(): void {
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return this.isTokenValid(token);
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === 'admin';
  }

  isEmployee(): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === 'employee';
  }

  isClient(): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === 'client';
  }

  redirectBasedOnRole(): void {
    const user = this.getCurrentUserValue();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    switch (user.role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'employee':
        this.router.navigate(['/employee']);
        break;
      case 'client':
        this.router.navigate(['/client']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Une erreur est survenue';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };
}

import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  submitted = false; // Ajout de cette propriété

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Rediriger si déjà connecté
    if (this.authService.isAuthenticated()) {
      this.authService.redirectBasedOnRole();
    }
  }

  onSubmit(): void {
    this.submitted = true; // Marquer comme soumis

    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.authService.redirectBasedOnRole();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.error || 'Erreur de connexion. Veuillez réessayer.';
        }
      });
    }
  }

  // Méthode corrigée pour éviter l'affichage immédiat des erreurs
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);

    // Afficher l'erreur seulement si :
    // 1. Le champ est invalide ET
    // 2. (Le formulaire a été soumis OU le champ a perdu le focus après modification)
    return !!(field && field.invalid &&
      (this.submitted || (field.dirty && field.touched)));
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}

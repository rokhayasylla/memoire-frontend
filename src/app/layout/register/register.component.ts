import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  submitted = false;

  // Options de rôles
  roleOptions = [
    { value: 'client', label: 'Client', description: 'Passer des commandes et gérer mon compte', icon: 'fas fa-user' },
    { value: 'employee', label: 'Employé', description: 'Gérer les commandes et livraisons', icon: 'fas fa-user-tie' },
    { value: 'admin', label: 'Administrateur', description: 'Gestion complète de la boulangerie', icon: 'fas fa-user-shield' },
    { value: 'livreur', label: 'Livreur', description: 'Acomplir livraison', icon: 'fas fa-user-shield' }

  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      role: ['client', Validators.required], // Rôle par défaut : client
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Rediriger si déjà connecté
    if (this.authService.isAuthenticated()) {
      this.authService.redirectBasedOnRole();
    }
  }

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirmation');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      // Préparer les données en gardant password_confirmation pour Laravel
      const formData = { ...this.registerForm.value };

      // S'assurer que les champs vides sont envoyés comme null ou supprimés
      if (!formData.phone || formData.phone.trim() === '') {
        delete formData.phone;
      }
      if (!formData.address || formData.address.trim() === '') {
        delete formData.address;
      }

      console.log('Données envoyées:', formData); // Pour debug

      this.authService.register(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Rediriger selon le rôle choisi
          this.redirectBasedOnRole(formData.role);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erreur complète:', error); // Pour debug

          if (error.error?.errors) {
            // Erreurs de validation du serveur
            const errors = error.error.errors;
            const errorMessages = Object.keys(errors).map(field => {
              return `${field}: ${errors[field].join(', ')}`;
            });
            this.errorMessage = errorMessages.join(' | ');
          } else if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = error.error?.error || 'Erreur lors de l\'inscription. Veuillez réessayer.';
          }
        }
      });
    } else {
      // Afficher les erreurs de validation côté client
      console.log('Erreurs de validation:', this.registerForm.errors);
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        if (control && control.errors) {
          console.log(`${key}:`, control.errors);
        }
      });
    }
  }

  // Redirection basée sur le rôle
  private redirectBasedOnRole(role: string): void {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'employee':
        this.router.navigate(['/employee']);
        break;

      case 'livreur':
        this.router.navigate(['/livreur']);
        break;
      case 'client':
      default:
        this.router.navigate(['/client']);
        break;
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (this.submitted || (field.dirty && field.touched)));
  }

  getFieldErrors(fieldName: string): string[] {
    const field = this.registerForm.get(fieldName);
    const errors: string[] = [];

    if (field && field.errors && this.isFieldInvalid(fieldName)) {
      if (field.errors['required']) {
        errors.push(this.getRequiredMessage(fieldName));
      }
      if (field.errors['email']) {
        errors.push('Format d\'email invalide');
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        if (fieldName === 'password') {
          errors.push(`Le mot de passe doit contenir au moins ${requiredLength} caractères`);
        } else {
          errors.push(`Minimum ${requiredLength} caractères requis`);
        }
      }
      if (field.errors['pattern'] && fieldName === 'phone') {
        errors.push('Format de téléphone invalide');
      }
      if (field.errors['passwordMismatch']) {
        errors.push('Les mots de passe ne correspondent pas');
      }
    }

    return errors;
  }

  private getRequiredMessage(fieldName: string): string {
    const messages: { [key: string]: string } = {
      full_name: 'Le nom complet est requis',
      email: 'L\'email est requis',
      role: 'Le rôle est requis',
      password: 'Le mot de passe est requis',
      password_confirmation: 'La confirmation du mot de passe est requise'
    };
    return messages[fieldName] || 'Ce champ est requis';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
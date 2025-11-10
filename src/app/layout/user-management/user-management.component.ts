import { Component, OnInit } from '@angular/core';
import { User, CreateUserRequest, UpdateUserRequest } from '../../models/user';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  showUserModal: boolean = false;
  isEditingUser: boolean = false;
  currentUser: User | null = null;

  userForm = {
    full_name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'client' as 'admin' | 'employee' | 'client' | 'livreur',
    is_active: true
  };

  loading = false;
  error: string | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
        console.error('Error loading users:', error);
      }
    });
  }

  openUserModal(user?: User): void {
    this.isEditingUser = !!user;
    this.currentUser = user || null;

    if (user) {
      this.userForm = {
        full_name: user.full_name,
        email: user.email,
        password: '',
        phone: user.phone || '',
        address: user.address || '',
        role: user.role,
        is_active: user.is_active
      };
    } else {
      this.userForm = {
        full_name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        role: 'client',
        is_active: true
      };
    }

    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.isEditingUser = false;
    this.currentUser = null;
    this.userForm = {
      full_name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      role: 'client',
      is_active: true
    };
    this.error = null;
  }

  saveUserChanges(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = null;

    if (this.isEditingUser && this.currentUser) {
      const updateData: UpdateUserRequest = {
        full_name: this.userForm.full_name.trim(),
        email: this.userForm.email.trim(),
        phone: this.userForm.phone.trim() || undefined,
        address: this.userForm.address.trim() || undefined,
        role: this.userForm.role,
        is_active: this.userForm.is_active
      };

      // Ajouter le mot de passe seulement s'il est fourni
      if (this.userForm.password.trim()) {
        updateData.password = this.userForm.password;
      }

      this.userService.updateUser(this.currentUser.id, updateData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeUserModal();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la modification de l\'utilisateur';
          this.loading = false;
          console.error('Error updating user:', error);
        }
      });
    } else {
      const createData: CreateUserRequest = {
        full_name: this.userForm.full_name.trim(),
        email: this.userForm.email.trim(),
        password: this.userForm.password,
        phone: this.userForm.phone.trim() || undefined,
        address: this.userForm.address.trim() || undefined,
        role: this.userForm.role
      };

      this.userService.createUser(createData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeUserModal();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la création de l\'utilisateur';
          this.loading = false;
          console.error('Error creating user:', error);
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.userForm.full_name.trim()) {
      this.error = 'Le nom complet est obligatoire';
      return false;
    }

    if (!this.userForm.email.trim()) {
      this.error = 'L\'email est obligatoire';
      return false;
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.userForm.email)) {
      this.error = 'Format d\'email invalide';
      return false;
    }

    if (!this.isEditingUser && !this.userForm.password.trim()) {
      this.error = 'Le mot de passe est obligatoire pour créer un utilisateur';
      return false;
    }

    if (this.userForm.password.trim() && this.userForm.password.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères';
      return false;
    }

    return true;
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.is_active;
    const action = newStatus ? 'activer' : 'désactiver';

    if (confirm(`Êtes-vous sûr de vouloir ${action} l'utilisateur "${user.full_name}" ?`)) {
      this.loading = true;
      this.userService.toggleUserStatus(user.id, newStatus).subscribe({
        next: () => {
          this.loadUsers();
          this.loading = false;
        },
        error: (error) => {
          this.error = `Erreur lors de la modification du statut de l'utilisateur`;
          this.loading = false;
          console.error('Error toggling user status:', error);
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.full_name}" ? Cette action est irréversible.`)) {
      this.loading = true;
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la suppression de l\'utilisateur';
          this.loading = false;
          console.error('Error deleting user:', error);
        }
      });
    }
  }

  getRoleDisplayName(role: string): string {
    const roleNames = {
      admin: 'Administrateur',
      employee: 'Employé',
      client: 'Client',
      livreur: 'Livreur'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  }

  getRoleClass(role: string): string {
    const roleClasses = {
      admin: 'bg-red-100 text-red-800',
      employee: 'bg-blue-100 text-blue-800',
      client: 'bg-green-100 text-green-800',
      livreur: 'bg-yellow-100 text-yellow-800' 
    };
    return roleClasses[role as keyof typeof roleClasses] || 'bg-gray-100 text-gray-800';
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Actif' : 'Inactif';
  }
}

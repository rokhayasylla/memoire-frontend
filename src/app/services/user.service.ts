import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {CreateUserRequest, UpdateUserRequest, User} from "../models/user";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = environment.ApiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  updateUser(id: number, user: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  toggleUserStatus(id: number, isActive: boolean): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, { is_active: isActive });
  }

  getEmployees(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/employees`);
  }

  getClients(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/clients`);
  }

  getLivreurs(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/livreurs`);
  }
}

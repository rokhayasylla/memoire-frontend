import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Invoice, CreateInvoiceRequest } from '../models/invoice';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly apiUrl = environment.ApiUrl;

  constructor(private http: HttpClient) {}

  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/invoices`);
  }

  getInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`);
  }

  createInvoice(invoice: CreateInvoiceRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/invoices`, invoice);
  }

  getMyInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/my-invoices`);
  }

  sendInvoiceByEmail(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/invoices/${id}/send-email`, {});
  }
}

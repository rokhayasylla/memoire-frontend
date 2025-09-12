import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  /**
   * Télécharger une facture en PDF
   */
  downloadInvoice(id: number): Observable<Blob> {
    const headers = new HttpHeaders({
      'Accept': 'application/pdf'
    });

    return this.http.get(`${this.apiUrl}/invoices/${id}/download`, {
      headers: headers,
      responseType: 'blob'
    });
  }

  /**
   * Obtenir l'URL de prévisualisation d'une facture
   */
  getPreviewUrl(id: number): string {
    return `${this.apiUrl}/invoices/${id}/preview`;
  }

  /**
   * Générer manuellement le PDF d'une facture (admin)
   */
  generatePDF(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/invoices/${id}/generate-pdf`, {});
  }

  /**
   * Méthode utilitaire pour déclencher le téléchargement d'un fichier
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Télécharger une facture avec gestion automatique du nom de fichier
   */
  downloadInvoiceFile(invoice: Invoice): void {
    this.downloadInvoice(invoice.id).subscribe({
      next: (blob: Blob) => {
        const filename = `facture-${invoice.invoice_number}.pdf`;
        this.downloadFile(blob, filename);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement:', error);
        throw error;
      }
    });
  }
}
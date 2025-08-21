import { Component, OnInit } from '@angular/core';
import { Invoice } from '../../models/invoice';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-client-invoices',
  templateUrl: './client-invoices.component.html',
  styleUrl: './client-invoices.component.css'
})
export class ClientInvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  loading = false;
  error: string | null = null;
  selectedInvoice: Invoice | null = null;
  showInvoiceDetails = false;

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading = true;
    this.error = null;

    this.invoiceService.getMyInvoices().subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des factures';
        this.loading = false;
        console.error('Error loading invoices:', error);
      }
    });
  }

  viewInvoiceDetails(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.showInvoiceDetails = true;
  }

  closeInvoiceDetails(): void {
    this.showInvoiceDetails = false;
    this.selectedInvoice = null;
  }

  downloadInvoice(invoice: Invoice): void {
    if (invoice.pdf_path) {
      // Logique pour télécharger le PDF
      window.open(invoice.pdf_path, '_blank');
    } else {
      alert('PDF non disponible pour cette facture');
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusBadgeClass(sentByEmail: boolean): string {
    return sentByEmail ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  }

  getStatusLabel(sentByEmail: boolean): string {
    return sentByEmail ? 'Envoyée par email' : 'Non envoyée';
  }

  trackByInvoiceId(index: number, invoice: Invoice): number {
    return invoice.id;
  }
}

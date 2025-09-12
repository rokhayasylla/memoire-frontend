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
  downloadingInvoices = new Set<number>(); // Pour tracker les téléchargements en cours

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

  /**
   * Télécharger une facture PDF
   */
  downloadInvoice(invoice: Invoice): void {
    if (this.downloadingInvoices.has(invoice.id)) {
      return; // Téléchargement déjà en cours
    }

    this.downloadingInvoices.add(invoice.id);

    this.invoiceService.downloadInvoice(invoice.id).subscribe({
      next: (blob: Blob) => {
        // Créer le nom du fichier
        const filename = `facture-${invoice.invoice_number}.pdf`;
        
        // Créer l'URL de téléchargement
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Déclencher le téléchargement
        document.body.appendChild(link);
        link.click();
        
        // Nettoyer
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.downloadingInvoices.delete(invoice.id);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement:', error);
        
        // Afficher un message d'erreur approprié
        if (error.status === 404) {
          this.showErrorMessage('Facture PDF non trouvée');
        } else if (error.status === 403) {
          this.showErrorMessage('Vous n\'êtes pas autorisé à télécharger cette facture');
        } else {
          this.showErrorMessage('Erreur lors du téléchargement de la facture');
        }
        
        this.downloadingInvoices.delete(invoice.id);
      }
    });
  }

  /**
   * Utilisation de la méthode utilitaire du service
   */
  downloadInvoiceSimple(invoice: Invoice): void {
    if (this.downloadingInvoices.has(invoice.id)) {
      return;
    }

    this.downloadingInvoices.add(invoice.id);

    try {
      this.invoiceService.downloadInvoiceFile(invoice);
      this.downloadingInvoices.delete(invoice.id);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      this.showErrorMessage('Erreur lors du téléchargement de la facture');
      this.downloadingInvoices.delete(invoice.id);
    }
  }

  /**
   * Prévisualiser une facture dans un nouvel onglet
   */
  previewInvoice(invoice: Invoice): void {
    const previewUrl = this.invoiceService.getPreviewUrl(invoice.id);
    window.open(previewUrl, '_blank');
  }

  /**
   * Vérifier si un téléchargement est en cours
   */
  isDownloading(invoiceId: number): boolean {
    return this.downloadingInvoices.has(invoiceId);
  }

  /**
   * Afficher un message d'erreur
   */
  private showErrorMessage(message: string): void {
    // Vous pouvez utiliser une library de notification comme ngx-toastr
    // ou afficher un message simple
    alert(message);
    
    // Ou utiliser une méthode plus sophistiquée
    // this.notificationService.error(message);
  }

  /**
   * Envoyer la facture par email
   */
  sendInvoiceByEmail(invoice: Invoice): void {
    this.invoiceService.sendInvoiceByEmail(invoice.id).subscribe({
      next: () => {
        // Mettre à jour l'état local
        invoice.sent_by_email = true;
        this.showErrorMessage('Facture envoyée par email avec succès');
      },
      error: (error) => {
        console.error('Erreur envoi email:', error);
        this.showErrorMessage('Erreur lors de l\'envoi de l\'email');
      }
    });
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
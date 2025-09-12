import { Component, OnDestroy, OnInit } from '@angular/core';
import { Chatmessage } from '../../models/chatmessage';
import { Subscription } from 'rxjs';
import { ChatmessageService } from '../../services/chatmessage.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-clientchat',
  templateUrl: './clientchat.component.html',
  styleUrl: './clientchat.component.css'
})
export class ClientchatComponent implements OnInit, OnDestroy {

  isChatOpen = false;
  messages: Chatmessage[] = [];
  newMessage = '';
  loading = false;
  sending = false;
  unreadCount = 0;
  hasNewMessage = false;
  private subscriptions: Subscription[] = [];
  private currentUserId: number | null = null;
  private pollingInterval: any = null;

  constructor(
    private chatService: ChatmessageService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Attendre que l'authentification soit initialisée
      const isAuthenticated = await this.authService.initializeAuth();
      
      if (!isAuthenticated) {
        console.warn('Utilisateur non authentifié');
        return;
      }

      // Récupérer l'ID de l'utilisateur actuel
      const currentUser = this.authService.getCurrentUserValue();
      if (currentUser) {
        this.currentUserId = currentUser.id;
        this.initializeChat();
      }

      // S'abonner aux changements d'utilisateur
      const userSub = this.authService.currentUser$.subscribe(user => {
        if (user && user.id !== this.currentUserId) {
          this.currentUserId = user.id;
          this.loadMessages();
        }
      });
      this.subscriptions.push(userSub);
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    }
  }

  private initializeChat(): void {
    // Charger les messages existants
    this.loadMessages();
    
    // S'abonner aux nouveaux messages
    this.subscribeToNewMessages();
    
    // Démarrer le polling
    this.startPolling();
  }

  private subscribeToNewMessages(): void {
    if (!this.chatService.newMessages$) {
      console.warn('newMessages$ observable non disponible');
      return;
    }

    const newMessageSub = this.chatService.newMessages$.subscribe({
      next: (message) => {
        if (this.shouldProcessMessage(message)) {
          this.processNewMessage(message);
        }
      },
      error: (error) => {
        console.error('Erreur dans newMessages$ subscription:', error);
      }
    });
    
    this.subscriptions.push(newMessageSub);
  }

  private shouldProcessMessage(message: any): boolean {
    return message && 
           this.currentUserId && 
           message.sender_type === 'support' && 
           message.user_id === this.currentUserId;
  }

  private processNewMessage(message: Chatmessage): void {
    // Vérifier si le message n'existe pas déjà
    const existingMessageIndex = this.messages.findIndex(m => m.id === message.id);
    
    if (existingMessageIndex === -1) {
      this.messages.push(message);
      
      if (!this.isChatOpen) {
        this.unreadCount++;
        this.hasNewMessage = true;
        setTimeout(() => this.hasNewMessage = false, 3000);
      }
      
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  private startPolling(): void {
    // Nettoyer le polling existant
    this.stopPolling();
    
    this.pollingInterval = setInterval(() => {
      if (this.authService.isAuthenticated()) {
        this.loadMessages(false);
        if (!this.isChatOpen) {
          this.loadUnreadCount();
        }
      }
    }, 20000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.subscriptions.forEach(sub => {
      try {
        sub.unsubscribe();
      } catch (error) {
        console.error('Erreur lors du unsubscribe:', error);
      }
    });
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.markMessagesAsRead();
      this.loadMessages();
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  closeChat(): void {
    this.isChatOpen = false;
  }

  loadMessages(showLoading = true): void {
    if (!this.authService.isAuthenticated() || !this.chatService.getMyMessages) {
      console.warn('Service non disponible ou utilisateur non authentifié');
      return;
    }

    if (showLoading) this.loading = true;
    
    this.chatService.getMyMessages().subscribe({
      next: (messages) => {
        this.messages = Array.isArray(messages) ? messages : [];
        this.loading = false;
        if (this.isChatOpen) {
          setTimeout(() => this.scrollToBottom(), 100);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des messages:', error);
        this.loading = false;
        this.messages = []; // Reset en cas d'erreur
      }
    });
  }

  loadUnreadCount(): void {
    if (!this.chatService.getUnreadCount) {
      return;
    }

    this.chatService.getUnreadCount().subscribe({
      next: (result) => {
        if (result && typeof result.count === 'number' && !this.isChatOpen) {
          this.unreadCount = result.count;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du nombre de messages non lus:', error);
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || this.sending || !this.chatService.sendMessage) {
      return;
    }

    this.sending = true;
    const messageText = this.newMessage.trim();
    this.newMessage = '';

    this.chatService.sendMessage(messageText).subscribe({
      next: (message) => {
        if (message) {
          // Vérifier si le message n'existe pas déjà avant de l'ajouter
          const existingMessageIndex = this.messages.findIndex(m => m.id === message.id);
          if (existingMessageIndex === -1) {
            this.messages.push(message);
          }
        }
        
        this.sending = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi du message:', error);
        this.newMessage = messageText; // Restaurer le message en cas d'erreur
        this.sending = false;
      }
    });
  }

  markMessagesAsRead(): void {
    if (this.unreadCount > 0 && this.chatService.markMessagesAsRead) {
      this.chatService.markMessagesAsRead().subscribe({
        next: () => {
          this.unreadCount = 0;
        },
        error: (error) => {
          console.error('Erreur lors du marquage des messages comme lus:', error);
        }
      });
    }
  }

  formatMessageTime(timestamp: string): string {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        return date.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit' 
        });
      }
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '';
    }
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        const container = document.querySelector('.overflow-y-auto');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);
    } catch (error) {
      console.error('Erreur lors du scroll:', error);
    }
  }
trackByMessageId(index: number, message: Chatmessage): any {
    return message.id || index;
  }
  
}
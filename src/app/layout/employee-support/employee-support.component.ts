import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatConversation, Chatmessage } from '../../models/chatmessage';
import { Subscription } from 'rxjs';
import { ChatmessageService } from '../../services/chatmessage.service';

@Component({
  selector: 'app-employee-support',
  templateUrl: './employee-support.component.html',
  styleUrl: './employee-support.component.css'
})
export class EmployeeSupportComponent implements OnInit, OnDestroy {
  conversations: ChatConversation[] = [];
  selectedConversation: ChatConversation | null = null;
  messages: Chatmessage[] = [];
  replyMessage = '';
  
  loadingConversations = false;
  loadingMessages = false;
  sendingReply = false;
  
  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatmessageService) {}

  ngOnInit(): void {
    this.loadConversations();
    
    // S'abonner aux nouveaux messages (uniquement pour les messages clients)
    const newMessageSub = this.chatService.newMessages$.subscribe(message => {
      if (message && message.sender_type === 'client') {
        // Actualiser la liste des conversations seulement pour les nouveaux messages clients
        this.loadConversations();
        
        // Si c'est pour la conversation active, ajouter le message
        if (this.selectedConversation && message.user_id === this.selectedConversation.user_id) {
          // Vérifier si le message n'existe pas déjà
          const existingMessageIndex = this.messages.findIndex(m => m.id === message.id);
          if (existingMessageIndex === -1) {
            this.messages.push(message);
            this.scrollToBottom();
          }
        }
      }
    });
    this.subscriptions.push(newMessageSub);

    // Polling périodique réduit pour éviter la surcharge
    const pollingSub = setInterval(() => {
      this.loadConversations();
      if (this.selectedConversation) {
        this.loadMessages(this.selectedConversation.user_id, false);
      }
    }, 30000); // Augmenté à 30 secondes
    
    this.subscriptions.push({
      unsubscribe: () => clearInterval(pollingSub)
    } as Subscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadConversations(): void {
    this.loadingConversations = true;
    
    this.chatService.getAllConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations.sort((a, b) => 
          new Date(b.latest_message?.created_at || 0).getTime() - 
          new Date(a.latest_message?.created_at || 0).getTime()
        );
        this.loadingConversations = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des conversations:', error);
        this.loadingConversations = false;
      }
    });
  }

  selectConversation(conversation: ChatConversation): void {
    this.selectedConversation = conversation;
    this.loadMessages(conversation.user_id);
    
    // Marquer les messages comme lus
    this.chatService.markMessagesAsRead(conversation.user_id).subscribe({
      next: () => {
        // Mettre à jour le compteur de messages non lus
        conversation.unread_count = 0;
      }
    });
  }

  loadMessages(userId: number, showLoading = true): void {
    if (showLoading) this.loadingMessages = true;
    
    this.chatService.getUserMessages(userId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loadingMessages = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des messages:', error);
        this.loadingMessages = false;
      }
    });
  }

  sendReply(): void {
    if (!this.replyMessage.trim() || !this.selectedConversation || this.sendingReply) return;

    this.sendingReply = true;
    const messageText = this.replyMessage.trim();
    this.replyMessage = '';

    this.chatService.sendSupportReply(this.selectedConversation.user_id, messageText).subscribe({
      next: (message) => {
        // Ajouter directement le message à la liste (pas de duplication car envoyé depuis cette interface)
        this.messages.push(message);
        
        this.sendingReply = false;
        setTimeout(() => this.scrollToBottom(), 100);
        
        // Actualiser la liste des conversations
        this.loadConversations();
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi de la réponse:', error);
        this.replyMessage = messageText; // Restaurer le message
        this.sendingReply = false;
      }
    });
  }

  formatMessageTime(timestamp: string | undefined): string {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      const diffInDays = diffInHours / 24;

      if (diffInHours < 1) {
        return 'À l\'instant';
      } else if (diffInHours < 24) {
        return date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffInDays < 7) {
        return date.toLocaleDateString('fr-FR', { 
          weekday: 'short',
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        return date.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit',
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } catch (error) {
      return '';
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('#messagesContainer');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  getClientName(): string {
    return this.selectedConversation?.user?.full_name || 'Client';
  }
}
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
  private lastSentMessageId: number | null = null; // ✅ AJOUT

  constructor(private chatService: ChatmessageService) {}

  ngOnInit(): void {
    this.loadConversations();
    
    // ✅ CORRECTION : Ne s'abonner qu'aux messages clients
    const newMessageSub = this.chatService.newMessages$.subscribe(message => {
      if (message && message.sender_type === 'client') {
        // Actualiser seulement pour les messages clients
        this.loadConversations();
        
        if (this.selectedConversation && message.user_id === this.selectedConversation.user_id) {
          const existingMessageIndex = this.messages.findIndex(m => m.id === message.id);
          if (existingMessageIndex === -1) {
            this.messages.push(message);
            this.scrollToBottom();
          }
        }
      }
      // ✅ NE RIEN FAIRE pour les messages de support (ils sont déjà ajoutés manuellement)
    });
    this.subscriptions.push(newMessageSub);

    // ✅ CORRECTION : Polling moins agressif
    const pollingSub = setInterval(() => {
      this.loadConversations();
      // ✅ Ne recharger les messages que si l'employé n'est pas en train d'envoyer
      if (this.selectedConversation && !this.sendingReply) {
        this.loadMessages(this.selectedConversation.user_id, false);
      }
    }, 30000);
    
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
    
    this.chatService.markMessagesAsRead(conversation.user_id).subscribe({
      next: () => {
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

  // ✅ CORRECTION PRINCIPALE
  sendReply(): void {
    if (!this.replyMessage.trim() || !this.selectedConversation || this.sendingReply) return;

    this.sendingReply = true;
    const messageText = this.replyMessage.trim();
    this.replyMessage = '';

    this.chatService.sendSupportReply(this.selectedConversation.user_id, messageText).subscribe({
      next: (message) => {
        // ✅ Sauvegarder l'ID du dernier message envoyé
        this.lastSentMessageId = message.id || null;
        
        // ✅ Vérifier si le message n'existe pas déjà avant de l'ajouter
        const existingMessageIndex = this.messages.findIndex(m => m.id === message.id);
        if (existingMessageIndex === -1) {
          this.messages.push(message);
        }
        
        this.sendingReply = false;
        setTimeout(() => this.scrollToBottom(), 100);
        
        // ✅ Actualiser les conversations SANS recharger les messages
        this.loadConversations();
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi de la réponse:', error);
        this.replyMessage = messageText;
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
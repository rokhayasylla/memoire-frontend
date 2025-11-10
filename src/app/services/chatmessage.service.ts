import { Injectable } from '@angular/core';
import { ChatConversation, Chatmessage } from '../models/chatmessage';
import { Subject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ChatmessageService {

  private apiUrl = `${environment.ApiUrl}`;
  // Changement: utiliser Subject au lieu de BehaviorSubject
  private newMessagesSubject = new Subject<Chatmessage>();
  public newMessages$ = this.newMessagesSubject.asObservable();

  constructor(private http: HttpClient) {
    // Simuler la réception de nouveaux messages en temps réel
    this.startMessagePolling();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Client: Envoyer un message
  sendMessage(message: string): Observable<Chatmessage> {
    return this.http.post<Chatmessage>(`${this.apiUrl}/chat-messages`, {
      message: message,
      sender_type: 'client'
    }, { headers: this.getHeaders() }).pipe(
      tap(response => {
        // Notifier le nouveau message après l'envoi
        this.notifyNewMessage(response);
      })
    );
  }

  // Client: Récupérer ses messages
  getMyMessages(): Observable<Chatmessage[]> {
    return this.http.get<Chatmessage[]>(`${this.apiUrl}/my-messages`, {
      headers: this.getHeaders()
    });
  }

  // Compter les messages non lus
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-messages`, {
      headers: this.getHeaders()
    });
  }

  // Marquer les messages comme lus
  markMessagesAsRead(userId?: number): Observable<any> {
    if (userId) {
      // Pour le support: marquer les messages d'un utilisateur spécifique comme lus
      return this.http.patch(`${this.apiUrl}/chat-messages/read-user/${userId}`, {}, { 
        headers: this.getHeaders() 
      });
    } else {
      // Pour le client: marquer tous ses messages non lus comme lus
      return this.http.patch(`${this.apiUrl}/chat-messages/mark-all-read`, {}, { 
        headers: this.getHeaders() 
      });
    }
  }

  // Récupérer les messages non lus
  getUnreadMessages(): Observable<Chatmessage[]> {
    return this.http.get<Chatmessage[]>(`${this.apiUrl}/unread-messages`, {
      headers: this.getHeaders()
    });
  }

  // Support: Récupérer toutes les conversations
  getAllConversations(): Observable<ChatConversation[]> {
    return this.http.get<ChatConversation[]>(`${this.apiUrl}/chat-conversations`, {
      headers: this.getHeaders()
    });
  }

  // Support: Récupérer les messages d'un utilisateur spécifique
  getUserMessages(userId: number): Observable<Chatmessage[]> {
    return this.http.get<Chatmessage[]>(`${this.apiUrl}/chat-user-messages/${userId}`, {
      headers: this.getHeaders()
    });
  }

  // Support: Envoyer une réponse à un client
  sendSupportReply(userId: number, message: string): Observable<Chatmessage> {
    return this.http.post<Chatmessage>(`${this.apiUrl}/chat-messages`, {
      user_id: userId,
      message: message,
      sender_type: 'support'
    }, { headers: this.getHeaders() }).pipe(
      tap(response => {
        // Notifier le nouveau message seulement pour les messages de support
        // Car ils doivent être visibles côté client
       // this.notifyNewMessage(response);
      })
    );
  }

  // Polling pour les nouveaux messages (simulation temps réel)
  private startMessagePolling(): void {
    // Dans un vrai projet, utilisez WebSockets ou Server-Sent Events
    setInterval(() => {
      // Cette méthode sera appelée par les composants pour vérifier les nouveaux messages
    }, 5000);
  }

  // Notifier d'un nouveau message (avec protection contre les boucles)
  private lastNotifiedMessageId: number | null = null;
  
  notifyNewMessage(message: Chatmessage): void {
    // Éviter la re-notification du même message
    if (message.id && message.id === this.lastNotifiedMessageId) {
      return;
    }
    
    this.lastNotifiedMessageId = message.id || null;
    this.newMessagesSubject.next(message);
  }
}
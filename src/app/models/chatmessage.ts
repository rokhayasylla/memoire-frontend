export interface Chatmessage {
  id: number;
  user_id: number;
  message: string;
  sender_type: 'client' | 'support';
  is_read: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    full_name: string;
    email: string;
  };

  

}


export interface ChatConversation {
  user_id: number;
  user: {
    id: number;
    full_name: string;
    email: string;
  };
  latest_message: Chatmessage;
  unread_count: number;
  messages: Chatmessage[];
}
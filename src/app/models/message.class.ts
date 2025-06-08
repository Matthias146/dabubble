import { Timestamp } from "@angular/fire/firestore";
import { EmojiData } from './emoji-data.models';
import { User } from "./user.class";

export interface MessageData {
  text?: string;
  user?: User;
  timestamp?: any; // Use a more specific type if applicable
  emojis?: EmojiData[];
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  answersCount?: number;
}


export class Message {
  messageId!: string;
  text!: string;
  user!: User;  
  timestamp!: Date;
  fullDate!: string;
  emojis: EmojiData[] = [];
  fileUrl?: string | null;  
  fileType?: string | null; 
  fileName?: string | null; 
  isEditing: boolean = false;
  editedText: string = '';
  answersCount: number = 0;



  constructor(obj: MessageData = {}, messageId: string = '') {
    this.messageId = messageId;
    this.text = obj.text || '';
    this.user = obj.user ? new User(obj.user) : new User();  // User-Objekt instanziieren, falls vorhanden
    const date = obj.timestamp ? this.getDateFromTimestamp(obj.timestamp) : new Date();
    this.timestamp = date;
    this.fullDate = this.formatFullDate(date);

    this.emojis = (obj.emojis || []).map(e =>
      typeof e === 'string' ? { emoji: e, userIds: [] } : e // Setze userId auf ein leeres Array
    );
    this.fileUrl = obj.fileUrl || '';
    this.fileType = obj.fileType || '';
    this.fileName = obj.fileName || '';
    this.editedText = this.text;
    this.answersCount = obj.answersCount || 0;


  }

  private getDateFromTimestamp(timestamp: any): Date {
    return timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  }

  public formatTimestamp(): string {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return new Intl.DateTimeFormat('de-DE', options).format(this.timestamp) + ' Uhr';
  }

  private formatFullDate(date: Date): string {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Heute';
    }
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    };
    return new Intl.DateTimeFormat('de-DE', options).format(date);
  }

  public toJson() {
    return {
      messageId: this.messageId,
      text: this.text,
      user: this.user,
      timestamp: this.timestamp,
      fullDate: this.fullDate,
      emojis: this.emojis,
      fileUrl: this.fileUrl,
      fileType: this.fileType,
      fileName: this.fileName,
      answersCount: this.answersCount,
    };
  }


}

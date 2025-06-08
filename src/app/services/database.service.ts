import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(public firestore: Firestore) { }

  //erstellt einen neuen Chat
  async createNewChat(chatId: string, myUserId: string, userId: string) {
    const collectionRef = "chats";
    try {
      const docRef = doc(this.firestore, collectionRef, chatId);
      await setDoc(docRef, {
        users: [myUserId, userId]
      });
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Chats: ", error);
    };
  };

  // Neue Nachricht speichern
  async saveNewDirectMessage(dmData: any, chatId:string) {
    try {
      const docRef = await addDoc(collection(this.firestore, 'chats', chatId, 'messages'), dmData);
      await updateDoc(docRef, { messageId: docRef.id });
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Nachricht:', error);
    }
  };

  // Bearbeitete Nachricht speichern
  async saveEditedMessage(chatId: string, messageId: string, text: any) {
    try {
      await updateDoc(doc(this.firestore, 'chats', chatId, 'messages', messageId), {
        'text': text
      }
      );
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Nachricht:', error);
    }
  };

  // Nachricht löschen
  async deleteMessage(chatId: string, messageId: string){
    try{
      await deleteDoc(doc(this.firestore, 'chats', chatId, 'messages', messageId));
    } catch (error: any) {
      console.error('Fehler beim Löschen der Nachricht:', error);
    }
    
  }
}

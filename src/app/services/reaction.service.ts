import { Injectable } from '@angular/core';
import { User } from '../models/user.class';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ReactionService {

  lastReactions: string[] = ['reactionNerd', 'reactionRocket'];
  showReactionContainer: boolean = false;
  clickedMessage: string = '';

  constructor(public firestore: Firestore) { }

  //Reactions
  //if: wenn der aktuelle Nutzer noch nicht die angeklickte Reaktion gewählt hat, wird er dieser Reaktion hinzugefügt
  //else: wenn schon gewählt, dann wird er wieder entfernt
  hoveredMessageId: string | null = null;  // Speichert die ID des gehoverten Elements
  hoveredReaction: string | null = null;
  hoveredElement: { messageId: string | null; reactionType: string | null } = {
    messageId: null,
    reactionType: null,
  };


  // Funktion, um das gehoverte Element zu setzen
  isHovered(messageId: string | null, reactionType: string | null) {
    this.hoveredElement = { messageId, reactionType };
  }


  // Funktion, um die Sichtbarkeit zu prüfen
  isBubbleVisible(messageId: string, reactionType: string): boolean {
    return (
      this.hoveredElement.messageId === messageId &&
      this.hoveredElement.reactionType === reactionType
    );
  }

  
  async addReaction(currentUser: User, message: any, reaction: string) {
    const currentUserId = currentUser.userId;
    const currentUsers = message[reaction] || [];
    const currentUserReactedAlready = currentUsers.some((user: { userId: string; }) => user.userId === currentUserId);
    const chatDocRef = doc(this.firestore, 'chats', message.chatId, 'messages', message.messageId);
    if (!currentUserReactedAlready) {
      this.addUserReaction(chatDocRef, reaction, currentUsers, currentUser);
      this.changeLastReactions(reaction);
    } else {
      this.deleteUserReaction(chatDocRef, reaction, currentUsers, currentUserId);
    }
    this.showReactionContainer = false;
  }

  
  async toggleReactionContainer(event: any, clickedMessage: string){
    event.stopPropagation();
    this.clickedMessage = clickedMessage;
    this.showReactionContainer = !this.showReactionContainer;
  }


  async changeLastReactions(reaction: string){
    if(!this.lastReactions.includes(reaction)){
      this.lastReactions.unshift(reaction);
      this.lastReactions.length = 2;
    }else{
      return;
    }
  }


  async addUserReaction(chatDocRef: any, reaction: string, currentUsers: any, currentUser: User){
    await updateDoc(chatDocRef, {
      [reaction]: [...currentUsers, currentUser.toJson()]  // Sicherstellen, dass user im richtigen Format ist
    });
  }


  async deleteUserReaction(chatDocRef: any, reaction: string, currentUsers: any, currentUserId: string){
    const updatedUsers = currentUsers.filter((user: User) => user.userId !== currentUserId);
    await updateDoc(chatDocRef, {
      [reaction]: updatedUsers  
    });
  }
}

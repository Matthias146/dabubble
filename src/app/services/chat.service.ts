import { Injectable } from '@angular/core';
import { addDoc, collection, doc, documentId, Firestore, getDocs, onSnapshot, query, setDoc, updateDoc, where } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { directMessage } from '../models/directMessage.class';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SharedService } from './shared.service';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();
  private chatSubject = new BehaviorSubject<any>(null); // Haupt-Observable für den Chat
  chat$ = this.chatSubject.asObservable();
  chatId = '';
  userId = '';
  chatMessages: any[] = [];
  groupedMessages: { [key: string]: directMessage[] } = {};
  chatIsEmpty: boolean = true;
  selectedChannelId: string | null = null;
  showChannel = true;
  showChat = true;
  showMenu = true;
  textContent: string | null = null;
  safeUrl: SafeResourceUrl | null = null;  // Sichere URL wird hier gespeichert
  currentUserId: string = ''; // ID des aktuell eingeloggten Benutzers
  currentOpenChatId: string | null = null; // Aktuell geöffneter Chat
  private unreadCountMap = new Map<string, number>(); // Map für ungelesene Nachrichten pro Chat
  unreadCount$ = new BehaviorSubject<Map<string, number>>(this.unreadCountMap); // Observable für die UI
  enableScroll:boolean = true;
  openedChat:string = '';

  constructor(public firestore: Firestore, private sanitizer: DomSanitizer, public sharedService: SharedService, public dbService: DatabaseService) {
    this.showChannel = true;
    this.showChat = false;
    if(this.sharedService.isMobile){
      this.showMenu = true;
      this.showChannel = false;
      this.showChat = false;
    }
  }

  onChannelSelected(channel: any) {
    if (channel) {
      this.selectedChannelId = channel.id;
      this.showChannel = true;
      this.showChat = false;
      if(this.sharedService.isMobile){
        this.changeToMobile()
      }
    }
    else {
      this.selectedChannelId = null;
      if(this.sharedService.isMobile){
        this.changeToMobile();
        this.showChannel = true;
      }
    } 
  }

  onChatSelected() {
    this.showChannel = false;
    this.showChat = true;
    if(this.sharedService.isMobile){
      this.changeToMobile()
    }
  }

  changeToMobile(){
    this.showMenu = false;
    this.sharedService.goBackHeader = true;
  }

  //öffnet den privaten Chat
  async openDirectMessage(currentUserId: string, userId: string) {
    this.openedChat = '';
    this.chatIsEmpty = true;
    this.chatMessages = [];
    const chatId = await this.createChatID(currentUserId, userId);
    this.openedChat = chatId;
    const checkIfChatExists = query(collection(this.firestore, "chats"), where(documentId(), "==", chatId));
    const querySnapshot = await getDocs(checkIfChatExists);

    if (querySnapshot.empty) {
      await this.dbService.createNewChat(chatId, currentUserId, userId);
      this.chatId = chatId;
    } else {
      querySnapshot.forEach((doc) => {
        this.getChatData(chatId);
      });
      await this.markMessagesAsRead(chatId);
      //this.updateUnreadCounts(chatId);
    }
    this.getUserData(userId);
  };

  //erstellt eine Chat-ID aus den Nutzer ID's
  async createChatID(myUserId: string, userId: string) {
    return [myUserId, userId].sort().join('_');
  };

  // Benutzer-Daten abrufen
  async getUserData(userId: string) {
    this.userId = userId;
    const findUser = query(collection(this.firestore, "users"), where(documentId(), "==", userId));
    const querySnapshot = await getDocs(findUser);
    querySnapshot.forEach((doc) => {
      const user = doc.data();
      const userData = {
        userId: doc.id,
        name: user['name'],
        avatar: user['avatar'],
        mail: user['mail'],
        online: user['online'],
      };
      this.userSubject.next(userData);
    });
  };

  // Chat-Daten abrufen
  async getChatData(chatId: string) {
    this.chatId = chatId;
    const chatDocRef = doc(this.firestore, "chats", chatId);

    onSnapshot(chatDocRef, async (chatDoc) => {
      if (chatDoc.exists()) {
        const messagesCollection = collection(this.firestore, `chats/${chatDoc.id}/messages`);

        onSnapshot(messagesCollection, (messagesSnapshot) => {
          this.chatMessages = [];

          messagesSnapshot.forEach((messageDoc) => {
            const messageData = messageDoc.data();

            const chatData = {
              chatId: chatDoc.id,
              messageId: messageDoc.id,
              senderId: messageData['senderID'],
              receiverId: messageData['receiverID'],
              timestamp: messageData['timestamp'],
              time: messageData['time'],
              dayDateMonth: messageData['dayDateMonth'],
              text: messageData['text'],
              fileDownloadUrl: messageData['fileDownloadUrl'],
              fileName: messageData['fileName'],
              fileType: messageData['fileType'],
              safeFileUrl: this.sanitizer.bypassSecurityTrustResourceUrl(messageData['fileDownloadUrl']),
              reactionCelebrate: messageData['reactionCelebrate'],
              reactionCheck: messageData['reactionCheck'],
              reactionNerd: messageData['reactionNerd'],
              reactionRocket: messageData['reactionRocket'],
              isRead: messageData['isRead'],
              audioDownloadUrl: messageData['audioDownloadUrl']
            };

            this.chatMessages.push(chatData);
          });

          // Sortiere nach Timestamp und gruppiere nach Datum
          this.chatMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          this.groupMessagesByDate();
          // Setze das Observable mit den gruppierten Nachrichten
          this.chatSubject.next(this.groupedMessages);
          this.chatIsEmpty = this.chatMessages.length === 0;
        });
      }
    });
  };

  // Nachrichten nach Datum gruppieren
  groupMessagesByDate(): void {
    this.groupedMessages = this.chatMessages.reduce((groups: any, message: any) => {
      const date = message.timestamp.split('T')[0]; // Extrahiere das Datum
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});

    const groupedMessagesArray = Object.keys(this.groupedMessages).map(date => ({
      date,
      messages: this.groupedMessages[date]
    }));
    this.chatSubject.next(groupedMessagesArray);
  };

  // Nachricht senden
  async setChatData(newDm: string, fileDownloadUrl: string, selectedFileName: string, fileType: string, currentUserId: string, audioDownloadUrl:string) {
    const newDirectMessage = new directMessage();
    await this.setChatTime(newDirectMessage)
    newDirectMessage.chatId = this.chatId;
    newDirectMessage.senderId = currentUserId;
    newDirectMessage.receiverId = this.userId;
    newDirectMessage.text = newDm;
    newDirectMessage.fileName = selectedFileName;
    newDirectMessage.fileDownloadUrl = fileDownloadUrl;
    newDirectMessage.fileType = fileType;
    newDirectMessage.audioDownloadUrl = audioDownloadUrl;
    const dmData = newDirectMessage.toJson();
    await this.dbService.saveNewDirectMessage(dmData, this.chatId);
    await this.getChatData(this.chatId)
  };

  async setChatTime(newDirectMessage: directMessage){
    newDirectMessage.timestamp = await this.sharedService.getTimeStamp();
    newDirectMessage.time = newDirectMessage.timestamp.split('T')[1].slice(0, 5);
    newDirectMessage.dayDateMonth = await this.sharedService.getFormattedDate();
    return newDirectMessage.timestamp, newDirectMessage.time, newDirectMessage.dayDateMonth;
  }

  // Setze Daten für den editierten Chat
  async setEditedChatData(editedDM: string, message: any) {
    const chatId = message.chatId;
    const messageId = message.messageId;
    const text = editedDM;
    this.dbService.saveEditedMessage(chatId, messageId, text);
  };

  async doesChatExist(chatId: string): Promise<boolean> {
    const checkIfChatExists = query(collection(this.firestore, "chats"), where(documentId(), "==", chatId));
    const querySnapshot = await getDocs(checkIfChatExists);
    return !querySnapshot.empty;
  }

  // Senden der Nachricht an mehrere User
  async sendMessageToChat(chatId: string, newDm: string, fileDownloadUrl: string | null, fileName: string | null, fileType: string | null, currentUserId: string) {
    const newDirectMessage = new directMessage();
    newDirectMessage.chatId = chatId;
    newDirectMessage.senderId = currentUserId;
    newDirectMessage.receiverId = this.userId;
    newDirectMessage.text = newDm;
    await this.setChatTime(newDirectMessage)
    if (fileDownloadUrl) newDirectMessage.fileDownloadUrl = fileDownloadUrl;
    if (fileName) newDirectMessage.fileName = fileName;
    if (fileType) newDirectMessage.fileType = fileType;
    
    const dmData = newDirectMessage.toJson();

    try {
      await addDoc(collection(this.firestore, 'chats', chatId, 'messages'), dmData);
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Nachricht:', error);
    }
  }

  //Counter ungelesene Nachrichten
  async initializeUnreadCounts(currentUserId: string) {
    const chatsCollection = collection(this.firestore, 'chats');
    const userChatsQuery = query(chatsCollection, where('users', 'array-contains', currentUserId));
  
    // Überwache die Chats und Nachrichten
    onSnapshot(userChatsQuery, (chatSnapshot) => {
      this.unreadCountMap.clear(); // Zurücksetzen der Map
  
      chatSnapshot.forEach(async (chatDoc) => {
        const chatId = chatDoc.id;
        const messagesCollection = collection(this.firestore, `chats/${chatId}/messages`);
        const unreadMessagesQuery = query(
          messagesCollection,
          where('receiverID', '==', currentUserId),
          where('isRead', '==', false)
        );
  
        onSnapshot(unreadMessagesQuery, (messageSnapshot) => {
          const unreadCount = messageSnapshot.size; // Anzahl ungelesener Nachrichten
          
          if (this.openedChat === chatId) {
            
            // Wenn der aktuelle Chat geöffnet ist, setze den Zähler auf 0 und verlasse die Funktion
            this.unreadCountMap.set(chatId, 0);
            this.markMessagesAsRead(chatId)
          } else if (unreadCount > 0) {
            // Andernfalls füge den Chat mit der Anzahl der ungelesenen Nachrichten hinzu
            this.unreadCountMap.set(chatId, unreadCount);
          } else {
            // Entferne den Chat, wenn es keine ungelesenen Nachrichten mehr gibt
            this.unreadCountMap.delete(chatId);
          }
  
          this.unreadCount$.next(new Map(this.unreadCountMap)); // Aktualisiere die Map, um Abonnenten zu benachrichtigen
        });
      });
    });
  }

  // Setze alle Nachrichten als gelesen für den aktuellen Benutzer im geöffneten Chat
  async markMessagesAsRead(chatId: string) {
    const messagesCollection = collection(this.firestore, `chats/${chatId}/messages`);
    const unreadMessagesQuery = query(
      messagesCollection,
      where('isRead', '==', false),
      where('receiverID', '==', this.currentUserId)
    );

    try {
      const snapshot = await getDocs(unreadMessagesQuery); // Einmalige Abfrage der ungelesenen Nachrichten
      const updatePromises = snapshot.docs.map((messageDoc) => {
        const messageRef = doc(this.firestore, `chats/${chatId}/messages/${messageDoc.id}`);
        return updateDoc(messageRef, { isRead: true });
      });
  
      await Promise.all(updatePromises); // Warte, bis alle Nachrichten aktualisiert sind
    } catch (error: any) {
      console.error(`Fehler beim Markieren von Nachrichten als gelesen für Chat ${chatId}:`, error);
    }
  }

  // Methode zum Aktualisieren der ungelesenen Nachrichten-Zähler
  updateUnreadCounts(chatId: string) {
    this.unreadCountMap.set(chatId, 0);
    this.unreadCount$.next(new Map(this.unreadCountMap));
  }
}
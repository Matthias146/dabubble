import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, Firestore, onSnapshot, orderBy, query, updateDoc } from '@angular/fire/firestore';
import { Answer } from '../models/answer.class';
import { SharedService } from './shared.service';
import { FileService } from './file.service';
import { UserService } from './user.service';
import { deleteObject, getStorage, ref } from 'firebase/storage';


@Injectable({
  providedIn: 'root'
})
export class AnswersService {

  answer!: Answer;
  allAnswers: Answer[] = [];
  latestAnswerTimes = new Map<string, string | null>();
  selectedFile: File | null = null;
  constructor(public firestore: Firestore, public sharedService: SharedService, public fileService: FileService, public userService: UserService) { }
  shouldScrollToBottom: boolean = false;


  getAnswers(channelId: string | null, messageId: string, callback: () => void) {
    if (!channelId || !messageId) return;
    const answersCollectionRef = collection(this.firestore, `channels/${channelId}/messages/${messageId}/answers`);
    const answersQuery = query(answersCollectionRef, orderBy('timestamp'));

    this.allAnswers = [];
    onSnapshot(answersQuery, (snapshot) => {
      const answersData = snapshot.docs.map((doc) => {
        const data = doc.data();
        const userId = data['user']?.userId;
        const user = this.userService.userData.find(u => u.userId === userId);

        return new Answer({
          id: doc.id,
          messageId: data['messageId'],
          text: data['text'],
          user: user,
          timestamp: data['timestamp'],
          emojis: data['emojis'] || [],
          fileUrl: data['fileUrl'] || null,
          fileType: data['fileType'] || null,
          fileName: data['fileName'] || null,
        });
      });
      this.allAnswers = answersData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      callback();
    });
  }

  async saveAnswer(answer: Answer, channelId: string | null) {
    if (!channelId || !answer.messageId || !answer.id) {
      console.error('Fehlende erforderliche Parameter: ', { channelId, messageId: answer.messageId, answerId: answer.id });
      return;
    }
    const answerRef = doc(this.firestore, `channels/${channelId}/messages/${answer.messageId}/answers/${answer.id}`);
    try {
      const updateData: any = { text: answer.editedText };
      if (!answer.fileUrl) {
        updateData.fileUrl = null;
        updateData.fileType = null;
        updateData.fileName = null;
      }
      await updateDoc(answerRef, updateData);
      answer.text = answer.editedText;

      if (!answer.text.trim() && !answer.fileUrl) {
        await this.deleteAnswer(answer, channelId);
      } else {
        answer.isEditing = false;
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Nachricht:', error);
    }
  }

  resetFile(answer: Answer) {
    this.selectedFile = null;
    answer.fileUrl = '';
    answer.fileName = '';
    answer.fileType = '';
  }

  async deleteAnswer(answer: string | any, channelId: string | null) {
    try {
      const answerDocRef = doc(this.firestore, `channels/${channelId}/messages/${answer.messageId}/answers/${answer.id}`);
      await deleteDoc(answerDocRef);
    } catch (error) {
      console.error('Fehler beim Löschen der Antwort:', error);
    }
  }

  cancelEditAnswer(answer: Answer) {
    answer.isEditing = false;
    answer.editedText = answer.text;
  }

  async addNewAnswer(messageId: string, channelId: string | null, newAnswerText: string, userId: string, answerData: any) {
    try {
      const user = this.userService.userData.find(u => u.userId === userId);
      if (!user) return;
      const answersCollectionRef = collection(this.firestore, `channels/${channelId}/messages/${messageId}/answers`);
      await addDoc(answersCollectionRef, answerData);
      newAnswerText = '';
      this.selectedFile = null;
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Antwort:', error);
    }
  }

  async deleteEditedAnswer(messageId: string, channelId: string | null, editingAnswerId: string | null) {
    if (!channelId || !messageId || !editingAnswerId) {
      return;
    }
    try {
      const answerRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}/answers/${editingAnswerId}` );
      await deleteDoc(answerRef);  // Löschen der Antwort
    } catch (error) {
      console.error('Fehler beim Löschen der Antwort:', error);
    }
  }

  async editAnswer(messageId: string, newAnswerText: string, channelId: string|null, selectedAnswers: Answer[], editingAnswerId: string | null, fileUrl:string|null) {
    const updateData: any = { text: newAnswerText.trim() };
    if (!fileUrl) {
      updateData.fileUrl = null;
      updateData.fileType = null;
      updateData.fileName = null;
    }
    try {
      const answerRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}/answers/${editingAnswerId}`);
      await updateDoc(answerRef, updateData);
      const answer = selectedAnswers.find(a => a.id === editingAnswerId);
      if (answer) {
        answer.text = newAnswerText.trim();
        answer.isEditing = false;
        if (!answer.text && !fileUrl) {
          await this.deleteEditedAnswer(messageId, channelId, editingAnswerId);
        }
      }
      newAnswerText = '';
      this.selectedFile = null
      editingAnswerId = null;
    } catch (error) {
      console.error('Fehler beim Bearbeiten der Antwort:', error);
    }
  }
  

  deleteFile(answer: Answer) {
    if (!answer.fileUrl) return;
    answer.fileUrl = '';
    answer.fileName = '';
    answer.fileType = '';
    this.selectedFile = null;
  }

  updateUserInAnswers(answers: Answer[], channelId: string | null, messageId: string): void {
    answers.forEach(answer => {
      const updatedUser = this.userService.userData.find(
        user => user.userId === answer.user?.userId
      );

      if (updatedUser) {
        answer.user = updatedUser;
        this.saveUpdatedAnswer(answer, channelId, messageId); // Speichern in Firebase
      }
    });
  }
  async saveUpdatedAnswer(answer: Answer, channelId: string | null, messageId: string): Promise<void> {
    try {
      const answerRef = doc(
        this.firestore,
        `channels/${channelId}/messages/${messageId}/answers/${answer.id}`
      );
      await updateDoc(answerRef, { user: answer.user.toJson() });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Antwort:', error);
    }
  }
}





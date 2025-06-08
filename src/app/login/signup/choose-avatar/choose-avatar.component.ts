import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { updateDoc, Firestore, doc, setDoc } from '@angular/fire/firestore';
import { User } from '../../../models/user.class';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';


@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss'
})

export class ChooseAvatarComponent {
  @Input() user!: User;  
  @Output() switchToSignin = new EventEmitter<void>();
  @Output() closeAvatarPage = new EventEmitter<boolean>();  
  @Output() openFirstPage = new EventEmitter<boolean>();
  
  buttonEnabled: boolean = false;
  selectedFile: File | null = null;
  selectedFileName: string = '';  
  downloadURL: string = '';
  success: boolean = false;

  constructor(private firestore: Firestore, private auth: Auth, public dialog: MatDialog) {}

  avatars: string[] = [
    './assets/avatars/avatar_0.png',
    './assets/avatars/avatar_1.png',
    './assets/avatars/avatar_2.png',
    './assets/avatars/avatar_3.png',
    './assets/avatars/avatar_4.png',
    './assets/avatars/avatar_5.png'
  ];

  selectedAvatar: string = './assets/avatars/avatar_6.png';  

  async selectAvatar(avatar: string) {
    this.selectedAvatar = avatar;
    this.buttonEnabled = true;
    const avatarId = parseInt(avatar.match(/\d+/)?.[0] || '0', 10);
    this.user.avatar = avatarId;

    
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];    
      this.selectedFileName = this.selectedFile.name;
    }
  }

  async uploadFile() {
    if (!this.selectedFile) return;
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `avatars/${Date.now()}_${this.selectedFile.name}`);
      const snapshot = await uploadBytes(storageRef, this.selectedFile);
      const url = await getDownloadURL(snapshot.ref);
      this.user.avatar = url;
      this.downloadURL = url;
      this.selectedAvatar = url;
      this.buttonEnabled = true;  
      
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
    }
  }

  getBack() {
    this.openFirstPage.emit(true);
    this.closeAvatarPage.emit(false);
  }

  async onSubmit(ngForm: NgForm) {
    try {
      // Erstelle den User in Firebase Auth
      const userId = await this.createFirebaseUser();
  
      // User-Daten in Firestore speichern
      const userDocRef = doc(this.firestore, `users/${userId}`);
      await setDoc(userDocRef, {
        userId: userId, // Speichere die UID
        name: this.user.name,
        mail: this.user.mail,
        password: this.user.password,
        avatar: this.user.avatar, // Avatar-Daten hinzufügen
      });
  
      this.success = true;
  
      setTimeout(() => {
        this.switchToSignin.emit(); // Weiterleitung
      }, 2000);
    } catch (error) {
      console.error('Fehler beim Erstellen des Benutzers:', error);
    }
  }

  private async createFirebaseUser(): Promise<string> {
    const { user } = await createUserWithEmailAndPassword(this.auth, this.user.mail, this.user.password);
    return user.uid; // UID wird als userId verwendet
  }

  generateUserId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
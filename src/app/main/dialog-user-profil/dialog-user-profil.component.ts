import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../models/user.class';
import { CommonModule } from '@angular/common';
import { Channel } from '../../models/channel.class';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { FormControl, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { Auth, verifyBeforeUpdateEmail, EmailAuthProvider, reauthenticateWithCredential } from '@angular/fire/auth';
import { doc, setDoc } from '@angular/fire/firestore';
import { ChangeDetectorRef } from '@angular/core';
import { ChannelService } from '../../services/channel.service';

@Component({
  selector: 'app-dialog-user-profil',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dialog-user-profil.component.html',
  styleUrl: './dialog-user-profil.component.scss'
})
export class DialogUserProfilComponent {

  channel = new Channel();
  currentUser: any;
  currentPassword: string = '';

  currentUserId: string = '';
  chatPerson: any;

  isEditMode: boolean = false;
  isEditable: boolean; 

  emailChanged: boolean = false;
  passwordPlaceholder: string = '';

  @Output() chatSelected = new EventEmitter<void>();

  constructor(
    public dialogRef: MatDialogRef<DialogUserProfilComponent>,
    public firestore: Firestore,
    public auth: Auth,
    public chatService: ChatService,
    public userService: UserService,
    public sharedService: SharedService,
    public channelService:ChannelService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { user: User, isEditable: boolean }) { 
    this.isEditable = data.isEditable; 
  }

  avatars: string[] = [
    './assets/avatars/avatar_0.png',
    './assets/avatars/avatar_1.png',
    './assets/avatars/avatar_2.png',
    './assets/avatars/avatar_3.png',
    './assets/avatars/avatar_4.png',
    './assets/avatars/avatar_5.png'
  ];

  selectedAvatar: string = './assets/avatars/avatar_6.png';  
  originalAvatar: string | number = '';

  selectedChannel: Channel | null = null;

  name = new FormControl('');
  email = new FormControl('');

  ngOnInit() {
    this.userService.currentUser$.subscribe(currentUser => {
      this.currentUser = currentUser;
      if (currentUser) {
        this.currentUserId = currentUser.userId;
      }
    });
    this.editedUser = this.currentUser;
    this.name.setValue(this.currentUser.name);
    this.email.setValue(this.currentUser.mail)
  }

  getAvatarForUser(user: any) {
    if (user) {
      if (this.userService.isNumber(user.avatar)) {
        return './assets/avatars/avatar_' + user.avatar + '.png'; 
      } else {
        return user.avatar;  
      }
    }
    return './assets/avatars/avatar_0.png';  
  }

  async selectAvatar(avatar: string) {
    this.selectedAvatar = avatar;
    const avatarId = parseInt(avatar.match(/\d+/)?.[0] || '0', 10);
    this.editedUser.avatar = avatarId;
  }


  checkEmailBlur() {
    const enteredEmail = this.email.value; 
    const currentEmail = this.auth.currentUser?.email; 
  
    if (enteredEmail === currentEmail) {
      this.emailChanged = false;
    } else {
      this.emailChanged = true;
    }
  }

  saveProfile(form: NgForm) {
    if (this.emailChanged == true) {
      this.handleMailChange(form) 
    } else {
      this.handleSmallChanges(form)
    }
  }

  handleSmallChanges(form: NgForm) {
    if (!this.isFormValid(form)) return;
  
    const user = this.getCurrentUser();
    if (!user) return;
  
    this.reauthenticateAndUpdateUser(user).catch(() => this.handlePasswordError());
  }

  private isFormValid(form: NgForm): boolean {
    if (!form.valid) {
      alert('Formular ist ungültig.');
      return false;
    }
    return true;
  }

  private getCurrentUser(): any {
    const user = this.auth.currentUser;
    if (!user) {
      alert('Sie müssen angemeldet sein, um diese Aktion auszuführen.');
    }
    return user;
  }

  private reauthenticateAndUpdateUser(user: any): Promise<void> {
    return this.reauthenticateUser(user, this.currentPassword)
      .then(() => this.updateUserDataSmall())
      .then(() => this.finalizeUpdate());
  }

  editedUser!: User;

  private updateUserDataSmall(): void { 
    this.editedUser.name = this.name.value!;
    this.editedUser.mail = this.email.value!;
    this.editedUser.online = true;
    this.editedUser = new User({ ...this.editedUser });
    this.userService.updateUser(this.editedUser);
    localStorage.setItem('currentUser', JSON.stringify(this.editedUser));
  }
  
  private finalizeUpdate(): void {
    this.toggleEditMode();
    this.dialogRef.close();
  }
  
  private handlePasswordError(): void {
    this.currentPassword = '';
    this.passwordPlaceholder = 'Falsches Passwort!';
  }

  handleMailChange(form: NgForm) {
    if (!form.valid) {
      alert('Formular ist ungültig.');
      return;
    }
    const user = this.auth.currentUser;
    if (!user) {
      alert('Sie müssen angemeldet sein, um diese Aktion auszuführen.');
      return;
    }
    this.reauthenticateUser(user, this.currentPassword)
      .then(() => this.verifyEmailUpdate(user, this.email.value!))
      .then(() => this.updateUserData())
      .then(() => this.onEmailChangeSuccess())
      .catch(error => this.handleEmailChangeError(error));
  }

  private reauthenticateUser(user: any, currentPassword: string): Promise<void> {
    const credentials = EmailAuthProvider.credential(user.email!, currentPassword);
    return reauthenticateWithCredential(user, credentials).then(() => undefined); 
  }

  private verifyEmailUpdate(user: any, newEmail: string): Promise<void> {
    return verifyBeforeUpdateEmail(user, newEmail, {
      url: 'http://localhost:4200/mail-changed',
      handleCodeInApp: true,
    });
  }

  private updateUserData(): Promise<void> {
    this.editedUser.name = this.name.value!;
    this.editedUser.mail = this.email.value!;
    this.editedUser.online = true;

    this.editedUser = new User({ ...this.editedUser }); 
    localStorage.setItem('currentUser', JSON.stringify(this.editedUser)); 
    return this.userService.updateUserWithPromise(this.editedUser);
  }
  
  private onEmailChangeSuccess(): void {
    this.sharedService.setMailChangeSuccess(true);
    this.toggleEditMode();
    this.dialogRef.close();
  }
  
  private handleEmailChangeError(error: any): void {
    console.error('Fehler beim Aktualisieren der E-Mail-Adresse:', error);
  
    const errorMessages: { [key: string]: string } = {
      'auth/invalid-email': 'Die eingegebene E-Mail-Adresse ist ungültig.',
      'auth/email-already-in-use': 'Diese E-Mail-Adresse wird bereits verwendet.',
      'auth/wrong-password': 'Das eingegebene Passwort ist falsch.',
      'auth/requires-recent-login': 'Die Sitzung ist abgelaufen. Bitte loggen Sie sich erneut ein.',
    };
  
    const message = errorMessages[error.code] || 'Ein unbekannter Fehler ist aufgetreten: ' + error.message;
    alert(message);
  }

  toggleEditMode() {
    if (!this.isEditMode) {
      this.originalAvatar = this.data.user.avatar;
    } else {
      this.data.user.avatar = this.originalAvatar;
      this.selectedAvatar = this.getAvatarForUser(this.data.user);
    }
  
    this.isEditMode = !this.isEditMode;
  }
}
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { updateDoc, Firestore, doc, setDoc } from '@angular/fire/firestore';
import { User } from '../../../models/user.class';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-firstpage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './firstpage.component.html',
  styleUrl: './firstpage.component.scss'
})
export class FirstpageComponent implements OnInit {
  @Input() user: User = new User();
  @Output() switchToSignin = new EventEmitter<void>();
  @Output() closeFirstPage = new EventEmitter<boolean>();
  @Output() openAvatarPage = new EventEmitter<boolean>();
  @Output() userCreated = new EventEmitter<User>();
  
  ngOnInit(): void {
    if (!this.user) {
      this.user = new User();
    }
  }
  validName: boolean = true;
  validMail: boolean = true;
  checked: boolean = false;
  buttonEnabled: boolean = false;

  constructor(private firestore: Firestore, private auth: Auth) {}

  validateName(): void {
    const nameParts = this.user.name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      this.validName = false;
      this.user.name = ''; 
      setTimeout(() => {
        this.validName = true; 
        this.activateButton();
      }, 2000);
    } else {
      this.validName = true;
      this.activateButton(); 
    }
  }

  validateMail(): void {
    let emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(this.user.mail)) {
      this.validMail = false;
      this.user.mail = ''; 
      setTimeout(() => {
        this.validMail = true; 
        this.activateButton();
      }, 2000);
    } else {
      this.validMail = true;
      this.activateButton(); 
    }
  }

  togglePrivacy(): void {
    this.checked = !this.checked;
    this.activateButton(); 
  }

  activateButton(): void {
    this.buttonEnabled = this.validName && this.validMail && this.user.password.length >= 6 && this.checked;
  }

  async onSubmit(ngForm: NgForm) {
    if (this.buttonEnabled) {
      try {
        // if (this.user.userId) {
        //   await this.updateExistingUser();
        // } else {
        //   await this.addNewUser();
        // }
        this.handleSuccess();
      } catch (error) {
        console.error('Error saving document: ', error);
      }
    }
  }
  
  async updateExistingUser() {
    const userDocRef = doc(this.firestore, `users/${this.user.userId}`);
    await updateDoc(userDocRef, {
      name: this.user.name,
      mail: this.user.mail,
      password: this.user.password
    });
  }

  async addNewUser() {
    try {
      const userId = await this.createFirebaseUser();
      const newUser = this.createUserInstance(userId);
      await this.saveUserToFirestore(userId, newUser);
      this.user = newUser;
    } catch (error) {
      console.error('Fehler beim Erstellen des Benutzers: ', error);
    }
  }
  
  private async createFirebaseUser(): Promise<string> {
    const { user } = await createUserWithEmailAndPassword(this.auth, this.user.mail, this.user.password);
    return user.uid;
  }
  
  private createUserInstance(userId: string): User {
    return new User({
      name: this.user.name,
      mail: this.user.mail,
      password: this.user.password,
      userId: userId
    });
  }
  
  private async saveUserToFirestore(userId: string, user: User): Promise<void> {
    const userDocRef = doc(this.firestore, 'users', userId);
    await setDoc(userDocRef, user.toJson());
  }
  
  handleSuccess() {
    this.closeFirstPage.emit(false);  
    this.userCreated.emit(this.user);  
    this.openAvatarPage.emit(true);  
  }

  getBack() {
    this.switchToSignin.emit();
  }
}
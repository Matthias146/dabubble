import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Component, Output, EventEmitter } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-send-mail',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './send-mail.component.html',
  styleUrl: './send-mail.component.scss',
})
export class SendMailComponent {
  @Output() switchToSignin = new EventEmitter<void>();
  @Output() switchToResetPw = new EventEmitter<void>(); // EventEmitter hinzufügen

  buttonEnabled: boolean = false;
  emailNotFound: boolean = false;
  email: string = ''; // Füge die Variable email hinzu
  success: boolean = false;

  constructor(
    private firestore: Firestore,
    private http: HttpClient,
    private userService: UserService,
    private auth: Auth,
    private router: Router
  ) {}

  validateEmail(email: string) {
    const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    this.buttonEnabled = emailPattern.test(email);
    this.emailNotFound = false;
  }

  async checkEmail(email: string, event: Event) {
    event.preventDefault();

    const userExists = await this.doesUserExist(email);
    if (userExists) {
      await this.sendResetEmail(email);
      this.handleSuccess();
    } else {
      this.handleUserNotFound();
    }
  }

  private async doesUserExist(email: string): Promise<boolean> {
    const q = query(
      collection(this.firestore, 'users'),
      where('mail', '==', email)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  private async sendResetEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email, {
      url: 'https://dabubble.matthias-hammelehle.com/login',
      handleCodeInApp: true,
    });
  }

  private handleSuccess(): void {
    this.success = true;
    setTimeout(() => this.switchToSignin.emit(), 1200);
  }

  private handleUserNotFound(): void {
    this.emailNotFound = true;
  }

  getBack() {
    this.switchToSignin.emit();
  }
}

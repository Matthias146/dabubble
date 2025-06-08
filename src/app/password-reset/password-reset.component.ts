import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../app/services/user.service';
import { User } from '../models/user.class';
import { getAuth, updatePassword } from '@angular/fire/auth'; // Firebase Auth importieren
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router'; // Router importieren
import {
  Auth,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from '@angular/fire/auth';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss',
})
export class PasswordResetComponent {
  @Output() switchToMail = new EventEmitter<boolean>();
  buttonEnabled: boolean = false;
  success: boolean = false;
  password1: string = '';
  password2: string = '';
  user: User | null = null; // Der Benutzer, der sein Passwort ändern möchte
  oobCode: string = '';
  mode: string = '';
  passwordPlaceholder: string = 'Neues Passwort (min. 6 Zeichen)';
  isPasswordError: boolean = false;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.oobCode = params['oobCode']; // Der einmalige Code von Firebase
      this.mode = params['mode']; // Der Modus (z.B. 'resetPassword')
      this.verifyPasswordResetCode();
    });
  }

  verifyPasswordResetCode() {
    verifyPasswordResetCode(this.auth, this.oobCode)
      .then((email) => {})
      .catch((error) => {
        console.error('Fehler beim Verifizieren des Codes', error);
      });
  }

  resetPassword(newPassword: string) {
    confirmPasswordReset(this.auth, this.oobCode, newPassword)
      .then(() => {
        this.success = true; // Erfolgsmeldung anzeigen
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1200);
      })
      .catch((error) => {
        console.error('Fehler beim Zurücksetzen des Passworts:', error);
        this.success = false; // Fehler anzeigen
      });
  }

  validatePasswords() {
    const minLength = 5;
    this.buttonEnabled =
      this.password1.length >= minLength && this.password1 === this.password2;
  }

  minLength(): void {
    if (!this.password1 || this.password1.length < 6) {
      this.password1 = ''; // Eingabe zurücksetzen
      this.passwordPlaceholder = 'Mindestens 6 Zeichen erforderlich'; // Placeholder setzen
      this.isPasswordError = true;
    } else {
      this.passwordPlaceholder = 'Neues Passwort (min. 6 Zeichen)'; // Standard-Placeholder wiederherstellen
      this.isPasswordError = false;
    }
  }

  async changePassword() {
    const auth = getAuth();
    const currentUser = auth.currentUser; // Aktueller authentifizierter Benutzer

    if (currentUser) {
      try {
        // Ändere das Passwort des Benutzers in Firebase
        await updatePassword(currentUser, this.password1);
        this.success = true; // Erfolgsmeldung anzeigen
      } catch (error) {
        console.error('Fehler beim Ändern des Passworts:', error);
      }
    } else {
      console.error('Kein authentifizierter Benutzer gefunden.');
    }
  }

  getBack() {
    this.switchToMail.emit(true);
  }
}

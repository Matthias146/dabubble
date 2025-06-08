import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../app/services/user.service';
import { User } from '../models/user.class';
import { getAuth, updatePassword, applyActionCode } from '@angular/fire/auth'; 
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';  
import { Auth, confirmPasswordReset, verifyPasswordResetCode } from '@angular/fire/auth';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-mail-changed',
  standalone: true,
  imports: [],
  templateUrl: './mail-changed.component.html',
  styleUrl: './mail-changed.component.scss'
})

export class MailChangedComponent {
  @Output() switchToMail = new EventEmitter<boolean>();
  buttonEnabled: boolean = false;
  isSuccess: boolean = false;
  isLoading = true;
  password1: string = '';  
  password2: string = '';
  user: User | null = null;
  oobCode: string = '';
  mode: string = '';

  constructor(private firestore: Firestore, private userService: UserService, private route: ActivatedRoute, private auth: Auth, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const oobCode = params['oobCode']; 
      if (oobCode) {
        this.verifyEmailChange(oobCode); 
      } else {
        console.error('Kein oobCode gefunden.');
        this.isLoading = false;
      }
    });
  }

  private async verifyEmailChange(oobCode: string): Promise<void> {
    try {
        await applyActionCode(this.auth, oobCode); 
        setTimeout(() => {this.router.navigate(['/login']);}, 2000);
    } catch (error: any) {
        if (error.code === 'auth/user-token-expired') {
            console.error('Sitzungstoken ist abgelaufen. Weiterleitung zur Login-Seite.');
            this.router.navigate(['/login']);
        } else {
            console.error('Fehler beim Ändern der E-Mail-Adresse:', error);
        }
    } finally {
        this.isLoading = false;
    }
  }

  getBack() {
    this.switchToMail.emit(true);
  }
}
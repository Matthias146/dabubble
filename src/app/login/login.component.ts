import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';
import { PasswordMainComponent } from './password-main/password-main.component';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SigninComponent,
    SignupComponent,
    PasswordMainComponent,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  signUp: boolean = false;
  password: boolean = false;
  showLoading: boolean = true;
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const urlSegments = this.route.snapshot.url.map((segment) => segment.path);
    if (
      urlSegments.includes('password-main') &&
      urlSegments.includes('reset-password')
    ) {
      this.password = true;
    }

    this.route.queryParams.subscribe((params) => {
      if (params['skipLoading'] === 'true') {
        this.showLoading = false; // Ladeanimation überspringen
      } else {
        setTimeout(() => {
          this.showLoading = false; // Ladeanimation nach 3 Sekunden ausblenden
        }, 3000);
      }
    });
  }

  onSignUpChange(newSignUpValue: boolean) {
    this.signUp = newSignUpValue;
  }

  onPasswordChange(newPasswordValue: boolean) {
    this.password = newPasswordValue;
  }

  handleSwitchToSignin() {
    this.signUp = false;
    this.password = false;
  }
}

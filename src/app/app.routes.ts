import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { LoginComponent } from './login/login.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { ImprintComponent } from './login/imprint/imprint.component';
import { PrivacyPolicyComponent } from './login/privacy-policy/privacy-policy.component';
import { MailChangedComponent } from './mail-changed/mail-changed.component';
import { HandlerComponent } from './handler/handler.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'login/:userId', component: MainComponent },
  { path: 'handler', component: HandlerComponent },
  { path: 'imprint', component: ImprintComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'reset', component: PasswordResetComponent },
  { path: 'mail-changed', component: MailChangedComponent },
];

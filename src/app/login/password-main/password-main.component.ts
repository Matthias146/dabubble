import { Component, Output, EventEmitter } from '@angular/core';
import { SendMailComponent } from './send-mail/send-mail.component';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-password-main',
  standalone: true,
  imports: [SendMailComponent, CommonModule],
  templateUrl: './password-main.component.html',
  styleUrl: './password-main.component.scss'
})

export class PasswordMainComponent {
  @Output() switchToSignin = new EventEmitter<void>();
  reset: boolean = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const urlSegments = this.route.snapshot.url.map(segment => segment.path);
    if (urlSegments.includes('reset-password')) {
      this.reset = true;
    }
  }

  handleSwitchToSignin() {
    this.switchToSignin.emit();
  }

  handleSwitchToMail() {
    this.reset = false;
  }

  handleSwitchToResetPw() {
    this.reset = true;
  }
}
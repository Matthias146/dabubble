import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { FirstpageComponent } from './firstpage/firstpage.component';
import { ChooseAvatarComponent } from './choose-avatar/choose-avatar.component';
import { User } from '../../models/user.class'; 

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FirstpageComponent, ChooseAvatarComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  @Output() switchToSignin = new EventEmitter<void>();
  firstPage: boolean = true;
  avatar: boolean = false;
  createdUser!: User;

  handleSwitchToSignin() {
    this.switchToSignin.emit();
  }
}
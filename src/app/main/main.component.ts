import { Component } from '@angular/core';
import { ChannelComponent } from './channel/channel.component';
import { HeaderComponent } from './header/header.component';
import { MenuComponent } from './menu/menu.component';
import { ChatComponent } from "./chat/chat.component";
import { CommonModule } from '@angular/common';
import { ChatService } from '../services/chat.service';
import { SharedService } from '../services/shared.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, MenuComponent, ChannelComponent, HeaderComponent, ChatComponent],

  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

  showSuccessDialog: boolean = false;


  constructor(public chatService: ChatService, public sharedService: SharedService) { }

  ngOnInit() {
    this.sharedService.mailChangeSuccess$.subscribe((state) => {
      this.showSuccessDialog = state;
    });
    this.checkForMobile();
    if(this.sharedService.isMobile){
      this.changeToMobile();
    }
  }

  showSuccessDialogHandler(): void {
    this.showSuccessDialog = true;
  }

  toggleSuccessDialog(show: boolean): void {
    this.showSuccessDialog = show;
  }

    //Prüft, ob das Browserfenster kleiner als 810px ist und setzt die isMobile - Variable true/false.
    checkForMobile(){
      this.sharedService.isMobile = window.innerWidth <= 1024; // Example breakpoint for mobile screens
    }
  
    changeToMobile(){
      this.chatService.showMenu = true;
      this.chatService.showChat = false;
      this.chatService.showChannel = false;
    }

}

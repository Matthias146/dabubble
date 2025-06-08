
import { Component, OnInit, Renderer2, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SharedService } from './services/shared.service';
import { ChatService } from './services/chat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'da_bubble';

  constructor(public sharedService: SharedService, 
    public chatService: ChatService,
    private renderer: Renderer2){
  }

  ngOnInit(): void {
    this.checkForMobile();
    if(this.sharedService.isMobile){
      this.changeToMobile();
    }
  }

  // Prüft, ob Mobile Ansicht bei Änderung der Fenstergröße im Browser nötig ist.
  @HostListener('window:resize', ['$event'])
    onResize(event: Event): void {
      this.checkForMobile();
      if(!this.sharedService.isMobile){
        this.sharedService.goBackHeader = false;
      }
      if(this.sharedService.isMobile){
        this.changeToMobile();
      }
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

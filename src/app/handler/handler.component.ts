import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-handler',
  template: `<p>Verarbeite Anfrage...</p>`,
})
export class HandlerComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const mode = params['mode']; 
      const oobCode = params['oobCode']; 
      if (!mode || !oobCode) {
        console.error('Ungültige oder fehlende Parameter');
        return;
      }
      if (mode === 'verifyAndChangeEmail') {
        this.router.navigate(['/mail-changed'], { queryParams: { oobCode } });
      } else if (mode === 'resetPassword') {
        this.router.navigate(['/reset'], { queryParams: { oobCode } });
      } else {
        console.error('Unbekannter Modus:', mode);
      }
    });
  }
}


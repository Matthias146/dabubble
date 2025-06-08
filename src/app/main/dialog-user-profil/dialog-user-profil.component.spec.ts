import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogUserProfilComponent } from './dialog-user-profil.component';

describe('DialogUserProfilComponent', () => {
  let component: DialogUserProfilComponent;
  let fixture: ComponentFixture<DialogUserProfilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogUserProfilComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogUserProfilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

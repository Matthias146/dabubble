import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddChannelUserComponent } from './add-channel-user.component';

describe('AddChannelUserComponent', () => {
  let component: AddChannelUserComponent;
  let fixture: ComponentFixture<AddChannelUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddChannelUserComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddChannelUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

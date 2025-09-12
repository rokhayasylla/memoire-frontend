import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientchatComponent } from './clientchat.component';

describe('ClientchatComponent', () => {
  let component: ClientchatComponent;
  let fixture: ComponentFixture<ClientchatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientchatComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClientchatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

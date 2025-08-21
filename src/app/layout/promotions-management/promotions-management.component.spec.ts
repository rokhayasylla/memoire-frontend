import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromotionsManagementComponent } from './promotions-management.component';

describe('PromotionsManagementComponent', () => {
  let component: PromotionsManagementComponent;
  let fixture: ComponentFixture<PromotionsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PromotionsManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PromotionsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivreurDeliveriesComponent } from './livreur-deliveries.component';

describe('LivreurDeliveriesComponent', () => {
  let component: LivreurDeliveriesComponent;
  let fixture: ComponentFixture<LivreurDeliveriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivreurDeliveriesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LivreurDeliveriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

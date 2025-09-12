import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeDeliveriesComponent } from './employee-deliveries.component';

describe('EmployeeDeliveriesComponent', () => {
  let component: EmployeeDeliveriesComponent;
  let fixture: ComponentFixture<EmployeeDeliveriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeDeliveriesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeeDeliveriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

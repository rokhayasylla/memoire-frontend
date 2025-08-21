import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PacksManagementComponent } from './packs-management.component';

describe('PacksManagementComponent', () => {
  let component: PacksManagementComponent;
  let fixture: ComponentFixture<PacksManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PacksManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PacksManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

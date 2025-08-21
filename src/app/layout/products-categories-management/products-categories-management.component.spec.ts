import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsCategoriesManagementComponent } from './products-categories-management.component';

describe('ProductsCategoriesManagementComponent', () => {
  let component: ProductsCategoriesManagementComponent;
  let fixture: ComponentFixture<ProductsCategoriesManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductsCategoriesManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductsCategoriesManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

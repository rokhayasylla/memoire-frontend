import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivreurLayoutComponent } from './livreur-layout.component';

describe('LivreurLayoutComponent', () => {
  let component: LivreurLayoutComponent;
  let fixture: ComponentFixture<LivreurLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivreurLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LivreurLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

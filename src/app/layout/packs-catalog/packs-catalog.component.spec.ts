import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PacksCatalogComponent } from './packs-catalog.component';

describe('PacksCatalogComponent', () => {
  let component: PacksCatalogComponent;
  let fixture: ComponentFixture<PacksCatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PacksCatalogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PacksCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

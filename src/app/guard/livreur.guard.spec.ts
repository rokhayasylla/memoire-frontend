import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { livreurGuard } from './livreur.guard';

describe('livreurGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => livreurGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

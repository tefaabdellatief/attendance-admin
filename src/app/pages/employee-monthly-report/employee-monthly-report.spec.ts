import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeMonthlyReport } from './employee-monthly-report';

describe('EmployeeMonthlyReport', () => {
  let component: EmployeeMonthlyReport;
  let fixture: ComponentFixture<EmployeeMonthlyReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeMonthlyReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeMonthlyReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

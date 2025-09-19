import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AttendanceRecordsComponent } from './pages/attendance-records/attendance-records.component';
import { EmployeeMonthlyReportComponent } from './pages/employee-monthly-report/employee-monthly-report.component';
import { InstantSalaryCalculatorComponent } from './pages/instant-salary-calculator/instant-salary-calculator.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { 
        path: 'users', 
        loadChildren: () => import('./pages/users/users.module').then(m => m.UsersModule)
      },
      { 
        path: 'attendance-types', 
        loadChildren: () => import('./pages/attendance-types/attendance-types.module').then(m => m.AttendanceTypesModule)
      },
      { path: 'attendance-records', component: AttendanceRecordsComponent },
      { 
        path: 'deductions', 
        loadChildren: () => import('./pages/deductions/deductions.module').then(m => m.DeductionsModule)
      },
      { 
        path: 'additions', 
        loadChildren: () => import('./pages/additions/additions.module').then(m => m.AdditionsModule)
      },
      { path: 'reports/employee-monthly', component: EmployeeMonthlyReportComponent },
      { path: 'reports/instant-salary', component: InstantSalaryCalculatorComponent },
      { 
        path: 'request-statuses', 
        loadChildren: () => import('./pages/request-statuses/request-statuses.module').then(m => m.RequestStatusesModule)
      },
      { 
        path: 'shifts', 
        loadChildren: () => import('./pages/shifts/shifts.module').then(m => m.ShiftsModule)
      },
      { 
        path: 'branches', 
        loadChildren: () => import('./pages/branches/branches.module').then(m => m.BranchesModule)
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

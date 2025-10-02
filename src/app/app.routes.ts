import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  
  // User Management
  {
    path: 'users',
    loadChildren: () => import('./pages/users/users.module').then(m => m.UsersModule),
    canActivate: [authGuard]
  },
  
  // Branch Management
  {
    path: 'branches',
    loadChildren: () => import('./pages/branches/branches.module').then(m => m.BranchesModule),
    canActivate: [authGuard]
  },
  
  // Inventory Management
  {
    path: 'products',
    loadChildren: () => import('./pages/products/products.module').then(m => m.ProductsModule),
    canActivate: [authGuard]
  },
  {
    path: 'inventory',
    loadChildren: () => import('./pages/inventory/inventory.module').then(m => m.InventoryModule),
    canActivate: [authGuard]
  },
  {
    path: 'branch-inventory',
    loadChildren: () => import('./pages/branch-inventory/branch-inventory.module').then(m => m.BranchInventoryModule),
    canActivate: [authGuard]
  },
  {
    path: 'inventory-transactions',
    loadComponent: () => import('./pages/inventory-transactions/inventory-transactions.component').then(m => m.InventoryTransactionsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'inventory-transfer',
    loadComponent: () => import('./pages/inventory-transfer/inventory-transfer.component').then(m => m.InventoryTransferComponent),
    canActivate: [authGuard]
  },
  
  // Attendance Management
  {
    path: 'attendance-types',
    loadChildren: () => import('./pages/attendance-types/attendance-types.module').then(m => m.AttendanceTypesModule),
    canActivate: [authGuard]
  },
  {
    path: 'shifts',
    loadChildren: () => import('./pages/shifts/shifts.module').then(m => m.ShiftsModule),
    canActivate: [authGuard]
  },
  {
    path: 'attendance-records',
    loadComponent: () => import('./pages/attendance-records/attendance-records.component').then(m => m.AttendanceRecordsComponent),
    canActivate: [authGuard]
  },
  
  // Payroll Management
  {
    path: 'deductions',
    loadChildren: () => import('./pages/deductions/deductions.module').then(m => m.DeductionsModule),
    canActivate: [authGuard]
  },
  {
    path: 'additions',
    loadChildren: () => import('./pages/additions/additions.module').then(m => m.AdditionsModule),
    canActivate: [authGuard]
  },
  
  // Reports
  {
    path: 'employee-monthly-report',
    loadComponent: () => import('./pages/employee-monthly-report/employee-monthly-report.component').then(m => m.EmployeeMonthlyReportComponent),
    canActivate: [authGuard]
  },
  {
    path: 'instant-salary-calculator',
    loadComponent: () => import('./pages/instant-salary-calculator/instant-salary-calculator.component').then(m => m.InstantSalaryCalculatorComponent),
    canActivate: [authGuard]
  },
  
  // Settings
  {
    path: 'request-statuses',
    loadChildren: () => import('./pages/request-statuses/request-statuses.module').then(m => m.RequestStatusesModule),
    canActivate: [authGuard]
  },
  
  // Catch all route
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
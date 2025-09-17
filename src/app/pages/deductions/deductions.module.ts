import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { 
    path: '',
    loadComponent: () => import('./deductions-list/deductions-list.component').then(m => m.DeductionsListComponent)
  },
  { 
    path: 'new',
    loadComponent: () => import('./deductions-form/deductions-form.component').then(m => m.DeductionsFormComponent)
  },
  { 
    path: 'edit/:id',
    loadComponent: () => import('./deductions-form/deductions-form.component').then(m => m.DeductionsFormComponent)
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class DeductionsModule { }

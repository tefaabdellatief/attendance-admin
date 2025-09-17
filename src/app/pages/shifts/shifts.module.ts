import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { 
    path: '',
    loadComponent: () => import('./shifts-list/shifts-list.component').then(m => m.ShiftsListComponent)
  },
  { 
    path: 'new',
    loadComponent: () => import('./shifts-form/shifts-form.component').then(m => m.ShiftsFormComponent)
  },
  { 
    path: 'edit/:id',
    loadComponent: () => import('./shifts-form/shifts-form.component').then(m => m.ShiftsFormComponent)
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class ShiftsModule { }

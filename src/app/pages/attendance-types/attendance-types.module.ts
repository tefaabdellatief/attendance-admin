import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { 
    path: '',
    loadComponent: () => import('./attendance-types-list/attendance-types-list.component').then(m => m.AttendanceTypesListComponent)
  },
  { 
    path: 'new',
    loadComponent: () => import('./attendance-types-form/attendance-types-form.component').then(m => m.AttendanceTypesFormComponent)
  },
  { 
    path: 'edit/:id',
    loadComponent: () => import('./attendance-types-form/attendance-types-form.component').then(m => m.AttendanceTypesFormComponent)
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class AttendanceTypesModule { }

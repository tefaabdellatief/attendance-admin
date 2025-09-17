import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { 
    path: '',
    loadComponent: () => import('./users-list/users-list.component').then(m => m.UsersListComponent)
  },
  { 
    path: 'new',
    loadComponent: () => import('./users-form/users-form.component').then(m => m.UsersFormComponent)
  },
  { 
    path: 'edit/:id',
    loadComponent: () => import('./users-form/users-form.component').then(m => m.UsersFormComponent)
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class UsersModule { }

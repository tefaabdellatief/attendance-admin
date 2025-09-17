import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { 
    path: '',
    loadComponent: () => import('./branches-list/branches-list.component').then(m => m.BranchesListComponent)
  },
  { 
    path: 'new',
    loadComponent: () => import('./branches-form/branches-form.component').then(m => m.BranchesFormComponent)
  },
  { 
    path: 'edit/:id',
    loadComponent: () => import('./branches-form/branches-form.component').then(m => m.BranchesFormComponent)
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class BranchesModule { }

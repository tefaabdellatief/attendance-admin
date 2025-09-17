import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { 
    path: '',
    loadComponent: () => import('./additions-list/additions-list.component').then(m => m.AdditionsListComponent)
  },
  { 
    path: 'new',
    loadComponent: () => import('./additions-form/additions-form.component').then(m => m.AdditionsFormComponent)
  },
  { 
    path: 'edit/:id',
    loadComponent: () => import('./additions-form/additions-form.component').then(m => m.AdditionsFormComponent)
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class AdditionsModule { }

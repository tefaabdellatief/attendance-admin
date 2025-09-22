import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./branch-inventory-list/branch-inventory-list.component').then(m => m.BranchInventoryListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./branch-inventory-form/branch-inventory-form.component').then(m => m.BranchInventoryFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./branch-inventory-form/branch-inventory-form.component').then(m => m.BranchInventoryFormComponent)
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class BranchInventoryModule {}

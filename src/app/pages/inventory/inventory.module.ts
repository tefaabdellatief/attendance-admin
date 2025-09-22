import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./inventory-form/inventory-form.component').then(m => m.InventoryFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./inventory-form/inventory-form.component').then(m => m.InventoryFormComponent)
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class InventoryModule {}

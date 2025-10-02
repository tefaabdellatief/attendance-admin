import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./products-list/products-list.component').then(m => m.ProductsListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./products-form/products-form.component').then(m => m.ProductsFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./products-form/products-form.component').then(m => m.ProductsFormComponent)
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./products-view/products-view.component').then(m => m.ProductsViewComponent)
  },
  {
    path: 'recipes/:id',
    loadComponent: () => import('./products-recipes/products-recipes.component').then(m => m.ProductsRecipesComponent)
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class ProductsModule {}

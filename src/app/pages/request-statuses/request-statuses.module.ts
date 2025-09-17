import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { RequestStatusService } from '../../core/services/request-status.service';

const routes: Routes = [
  { 
    path: '',
    loadComponent: () => import('./request-status-list/request-status-list.component').then(m => m.RequestStatusListComponent)
  },
  { 
    path: 'new',
    loadComponent: () => import('./request-status-form/request-status-form.component').then(m => m.RequestStatusFormComponent)
  },
  { 
    path: 'edit/:id',
    loadComponent: () => import('./request-status-form/request-status-form.component').then(m => m.RequestStatusFormComponent)
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  providers: [RequestStatusService]
})
export class RequestStatusesModule { }

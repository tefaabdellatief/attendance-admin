import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" [class.card-hover]="hover" [class.card-border]="border">
      <div *ngIf="title || subtitle" class="card-header">
        <div class="card-header-content">
          <h3 *ngIf="title" class="card-title">{{ title }}</h3>
          <p *ngIf="subtitle" class="card-subtitle">{{ subtitle }}</p>
        </div>
        <div *ngIf="headerRight" class="card-header-right">
          <ng-content select="[card-header-right]"></ng-content>
        </div>
      </div>
      <div class="card-body">
        <ng-content></ng-content>
      </div>
      <div *ngIf="footer" class="card-footer">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .card {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 0;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      overflow: hidden;
    }
    
    .card-hover:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    
    .card-border {
      border: 1px solid var(--color-border);
    }
    
    .card-header {
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--color-border);
    }
    
    .card-header-content {
      flex: 1;
    }
    
    .card-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-color);
    }
    
    .card-subtitle {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: var(--text-color-light);
    }
    
    .card-body {
      padding: 1rem;
    }
    
    .card-footer {
      padding: 1rem;
      border-top: 1px solid var(--color-border);
      background-color: rgba(0, 0, 0, 0.02);
    }
    
    @media (max-width: 767px) {
      .card {
        border-radius: 6px;
      }
      
      .card-header, .card-body, .card-footer {
        padding: 0.75rem;
      }
      
      .card-title {
        font-size: 1rem;
      }
    }
  `]
})
export class CardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() hover = true;
  @Input() border = false;
  @Input() headerRight = false;
  @Input() footer = false;
}
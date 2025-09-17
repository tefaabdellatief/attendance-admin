import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [type]="type" 
      [disabled]="disabled || loading"
      [class]="getButtonClasses()"
      (click)="onClick($event)"
    >
      <div *ngIf="loading" class="spinner-sm mr-2"></div>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      outline: none;
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-primary {
      background-color: var(--color-primary);
      color: #fff;
    }
    
    .btn-primary:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }
    
    .btn-secondary {
      background-color: var(--color-secondary);
      color: #fff;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background-color: #1a2530;
    }
    
    .btn-success {
      background-color: var(--color-success);
      color: #fff;
    }
    
    .btn-success:hover:not(:disabled) {
      background-color: #219653;
    }
    
    .btn-danger {
      background-color: var(--color-danger);
      color: #fff;
    }
    
    .btn-danger:hover:not(:disabled) {
      background-color: #c0392b;
    }
    
    .btn-outline {
      background-color: transparent;
      border: 1px solid var(--color-border);
      color: var(--text-color);
    }
    
    .btn-outline:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
    
    .btn-lg {
      padding: 0.75rem 1.5rem;
      font-size: 1.125rem;
    }
    
    .btn-block {
      display: flex;
      width: 100%;
    }
    
    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() block = false;
  @Input() disabled = false;
  @Input() loading = false;
  
  @Output() btnClick = new EventEmitter<MouseEvent>();
  
  getButtonClasses(): string {
    const classes = [`btn-${this.variant}`];
    
    if (this.size !== 'md') {
      classes.push(`btn-${this.size}`);
    }
    
    if (this.block) {
      classes.push('btn-block');
    }
    
    return classes.join(' ');
  }
  
  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.btnClick.emit(event);
    }
  }
}
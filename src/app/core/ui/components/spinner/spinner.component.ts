import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container" [class.overlay]="overlay" [class.inline]="!overlay">
      <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
      <div *ngIf="message" class="spinner-message">{{ message }}</div>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .spinner-container.overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.8);
      z-index: 9999;
    }
    
    .spinner-container.inline {
      padding: 20px 0;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(246, 184, 25, 0.3);
      border-radius: 50%;
      border-top-color: var(--color-primary);
      animation: spin 1s ease-in-out infinite;
    }
    
    .spinner-message {
      margin-top: 16px;
      color: var(--color-primary-dark);
      font-weight: 500;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SpinnerComponent {
  @Input() overlay = true;
  @Input() size = 40;
  @Input() message = '';
}
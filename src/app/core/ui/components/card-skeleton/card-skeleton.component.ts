import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-card" [ngStyle]="{'height.px': height}">
      <div class="skeleton-header" *ngIf="showHeader">
        <div class="skeleton-title"></div>
        <div class="skeleton-subtitle" *ngIf="showSubtitle"></div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton-line" *ngFor="let i of lines" [ngStyle]="{'width.%': getRandomWidth()}"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-card {
      background-color: #fff;
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-sm);
      padding: 1rem;
      overflow: hidden;
      position: relative;
    }
    
    .skeleton-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
      animation: shimmer 1.5s infinite;
    }
    
    .skeleton-header {
      margin-bottom: 1rem;
    }
    
    .skeleton-title {
      height: 24px;
      background-color: #eaeaea;
      border-radius: 4px;
      margin-bottom: 8px;
      width: 70%;
    }
    
    .skeleton-subtitle {
      height: 16px;
      background-color: #eaeaea;
      border-radius: 4px;
      width: 40%;
    }
    
    .skeleton-line {
      height: 16px;
      background-color: #eaeaea;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    
    .skeleton-line:last-child {
      margin-bottom: 0;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `]
})
export class CardSkeletonComponent {
  @Input() height = 200;
  @Input() showHeader = true;
  @Input() showSubtitle = true;
  @Input() lineCount = 3;
  
  get lines() {
    return Array(this.lineCount).fill(0);
  }
  
  getRandomWidth() {
    // Return a random width between 70 and 100%
    return Math.floor(Math.random() * 30) + 70;
  }
}
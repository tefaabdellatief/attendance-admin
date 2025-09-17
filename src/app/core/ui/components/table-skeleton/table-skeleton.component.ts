import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-table">
      <div class="skeleton-header">
        <div class="skeleton-row">
          <div class="skeleton-cell" *ngFor="let col of columns"></div>
        </div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton-row" *ngFor="let row of rows">
          <div class="skeleton-cell" *ngFor="let col of columns" 
               [ngStyle]="{'width.%': getRandomWidth(col)}">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-table {
      width: 100%;
      min-width: 600px;
      border-collapse: separate;
      border-spacing: 0;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      position: relative;
    }
    
    .skeleton-table::after {
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
      background-color: var(--color-primary-dark);
      padding: 12px 0;
    }
    
    .skeleton-header .skeleton-cell {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .skeleton-row {
      display: flex;
      padding: 12px 8px;
      border-bottom: 1px solid #eaeaea;
    }
    
    .skeleton-body .skeleton-row:hover {
      background-color: rgba(246, 184, 25, 0.08);
    }
    
    .skeleton-cell {
      height: 20px;
      background-color: #eaeaea;
      border-radius: 4px;
      margin-right: 8px;
      flex: 1;
    }
    
    .skeleton-cell:last-child {
      margin-right: 0;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `]
})
export class TableSkeletonComponent {
  @Input() rowCount = 5;
  @Input() columnCount = 4;
  
  get rows() {
    return Array(this.rowCount).fill(0);
  }
  
  get columns() {
    return Array(this.columnCount).fill(0);
  }
  
  getRandomWidth(colIndex: number) {
    // For the first column, make it narrower (like an ID column)
    if (colIndex === 0) {
      return Math.floor(Math.random() * 10) + 20; // 20-30%
    }
    
    // For action columns (usually last), make them narrower
    if (colIndex === this.columnCount - 1) {
      return Math.floor(Math.random() * 10) + 15; // 15-25%
    }
    
    // For other columns, more random width
    return Math.floor(Math.random() * 30) + 70; // 70-100%
  }
}
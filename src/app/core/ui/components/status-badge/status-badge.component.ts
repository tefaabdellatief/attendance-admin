import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatusConfig {
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon?: string;
  description?: string;
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="status-badge" 
      [class]="getBadgeClasses()"
      [title]="statusConfig?.description || statusConfig?.label || status"
      [attr.data-status]="status">
      <span *ngIf="statusConfig?.icon" class="status-icon">{{ statusConfig?.icon }}</span>
      <span class="status-label">{{ statusConfig?.label || status }}</span>
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      line-height: 1;
      transition: all 0.2s ease;
      cursor: default;
      white-space: nowrap;
    }

    .status-badge:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .status-icon {
      font-size: 0.9em;
      line-height: 1;
    }

    .status-label {
      font-weight: 500;
    }

    /* Size variants */
    .status-badge.sm {
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
    }

    .status-badge.lg {
      padding: 0.375rem 1rem;
      font-size: 0.9rem;
    }

    /* Status type classes */
    .status-badge.active {
      background: rgba(27, 140, 32, 0.1);
      color: #1b8c20;
      border: 1px solid rgba(27, 140, 32, 0.3);
    }

    .status-badge.inactive {
      background: rgba(210, 35, 53, 0.1);
      color: #d23;
      border: 1px solid rgba(210, 35, 53, 0.3);
    }

    .status-badge.pending {
      background: rgba(255, 193, 7, 0.1);
      color: #f57c00;
      border: 1px solid rgba(255, 193, 7, 0.3);
    }

    .status-badge.processing {
      background: rgba(33, 150, 243, 0.1);
      color: #1976d2;
      border: 1px solid rgba(33, 150, 243, 0.3);
    }

    .status-badge.completed {
      background: rgba(76, 175, 80, 0.1);
      color: #388e3c;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }

    .status-badge.cancelled {
      background: rgba(158, 158, 158, 0.1);
      color: #616161;
      border: 1px solid rgba(158, 158, 158, 0.3);
    }

    .status-badge.rejected {
      background: rgba(244, 67, 54, 0.1);
      color: #d32f2f;
      border: 1px solid rgba(244, 67, 54, 0.3);
    }

    .status-badge.approved {
      background: rgba(76, 175, 80, 0.1);
      color: #2e7d32;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }

    .status-badge.draft {
      background: rgba(158, 158, 158, 0.1);
      color: #757575;
      border: 1px solid rgba(158, 158, 158, 0.3);
    }

    /* Custom status styling */
    .status-badge.custom {
      background: var(--custom-bg, rgba(246, 184, 25, 0.1));
      color: var(--custom-color, #f6b819);
      border: 1px solid var(--custom-border, rgba(246, 184, 25, 0.3));
    }

    /* Animation for status changes */
    .status-badge.changing {
      animation: statusChange 0.3s ease-in-out;
    }

    @keyframes statusChange {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() customConfig: StatusConfig | null = null;
  @Input() animated: boolean = false;

  // Default status configurations
  private defaultStatusConfigs: { [key: string]: StatusConfig } = {
    'active': {
      label: 'نشط',
      color: '#1b8c20',
      backgroundColor: 'rgba(27, 140, 32, 0.1)',
      borderColor: 'rgba(27, 140, 32, 0.3)',
      icon: '●',
      description: 'الحالة نشطة ومتاحة للاستخدام'
    },
    'inactive': {
      label: 'غير نشط',
      color: '#d23',
      backgroundColor: 'rgba(210, 35, 53, 0.1)',
      borderColor: 'rgba(210, 35, 53, 0.3)',
      icon: '●',
      description: 'الحالة غير نشطة وغير متاحة'
    },
    'pending': {
      label: 'في الانتظار',
      color: '#f57c00',
      backgroundColor: 'rgba(255, 193, 7, 0.1)',
      borderColor: 'rgba(255, 193, 7, 0.3)',
      icon: '⏳',
      description: 'في انتظار المراجعة أو الموافقة'
    },
    'processing': {
      label: 'قيد المعالجة',
      color: '#1976d2',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      borderColor: 'rgba(33, 150, 243, 0.3)',
      icon: '⚙️',
      description: 'قيد المعالجة حالياً'
    },
    'completed': {
      label: 'مكتمل',
      color: '#388e3c',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderColor: 'rgba(76, 175, 80, 0.3)',
      icon: '✅',
      description: 'تم إكمال المهمة بنجاح'
    },
    'cancelled': {
      label: 'ملغي',
      color: '#616161',
      backgroundColor: 'rgba(158, 158, 158, 0.1)',
      borderColor: 'rgba(158, 158, 158, 0.3)',
      icon: '❌',
      description: 'تم إلغاء المهمة'
    },
    'rejected': {
      label: 'مرفوض',
      color: '#d32f2f',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      borderColor: 'rgba(244, 67, 54, 0.3)',
      icon: '🚫',
      description: 'تم رفض الطلب'
    },
    'approved': {
      label: 'موافق عليه',
      color: '#2e7d32',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderColor: 'rgba(76, 175, 80, 0.3)',
      icon: '✅',
      description: 'تم الموافقة على الطلب'
    },
    'draft': {
      label: 'مسودة',
      color: '#757575',
      backgroundColor: 'rgba(158, 158, 158, 0.1)',
      borderColor: 'rgba(158, 158, 158, 0.3)',
      icon: '📝',
      description: 'مسودة غير مكتملة'
    }
  };

  get statusConfig(): StatusConfig | null {
    if (this.customConfig) {
      return this.customConfig;
    }
    
    const normalizedStatus = this.status?.toLowerCase().trim();
    return this.defaultStatusConfigs[normalizedStatus] || {
      label: this.status,
      color: '#666',
      backgroundColor: 'rgba(102, 102, 102, 0.1)',
      borderColor: 'rgba(102, 102, 102, 0.3)',
      icon: '●',
      description: `حالة: ${this.status}`
    };
  }

  getBadgeClasses(): string {
    const classes = ['status-badge'];
    
    // Add size class
    if (this.size !== 'md') {
      classes.push(this.size);
    }
    
    // Add status type class
    const normalizedStatus = this.status?.toLowerCase().trim();
    if (this.defaultStatusConfigs[normalizedStatus]) {
      classes.push(normalizedStatus);
    } else if (this.customConfig) {
      classes.push('custom');
    }
    
    // Add animation class
    if (this.animated) {
      classes.push('changing');
    }
    
    return classes.join(' ');
  }
}

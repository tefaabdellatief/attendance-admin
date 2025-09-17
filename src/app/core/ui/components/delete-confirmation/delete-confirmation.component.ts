import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-delete-confirmation',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="modal-overlay" [class.visible]="visible" (click)="onOverlayClick($event)">
      <div class="modal delete-modal" [class.visible]="visible">
        <div class="modal-header">
          <div class="header-icon">
            <span class="warning-icon">⚠️</span>
          </div>
          <h3>{{ title || 'تأكيد الحذف' }}</h3>
        </div>
        
        <div class="modal-body">
          <div class="confirmation-content">
            <p class="confirmation-message">{{ message || 'هل أنت متأكد من أنك تريد حذف هذا العنصر؟' }}</p>
            <div class="item-details" *ngIf="itemName">
              <div class="item-name">
                <strong>{{ itemName }}</strong>
              </div>
            </div>
            <div class="warning-note" *ngIf="showWarning">
              <span class="warning-text">⚠️ هذا الإجراء لا يمكن التراجع عنه</span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <app-button 
            variant="outline" 
            (btnClick)="onCancel()"
            [disabled]="loading">
            إلغاء
          </app-button>
          <app-button 
            variant="danger" 
            (btnClick)="onConfirm()"
            [loading]="loading"
            [disabled]="loading">
            {{ confirmText || 'حذف' }}
          </app-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .modal-overlay.visible {
      opacity: 1;
      visibility: visible;
    }

    .delete-modal {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow: hidden;
      transform: scale(0.9) translateY(20px);
      transition: all 0.3s ease;
    }

    .delete-modal.visible {
      transform: scale(1) translateY(0);
    }

    .modal-header {
      padding: 1.5rem 1.5rem 1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .warning-icon {
      font-size: 1.5rem;
    }

    .modal-header h3 {
      margin: 0;
      color: #1f2937;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .confirmation-content {
      text-align: center;
    }

    .confirmation-message {
      margin: 0 0 1rem 0;
      color: #374151;
      font-size: 1rem;
      line-height: 1.5;
    }

    .item-details {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }

    .item-name {
      color: #1f2937;
      font-size: 1.1rem;
    }

    .warning-note {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
    }

    .warning-text {
      color: #dc2626;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .modal-footer {
      padding: 1rem 1.5rem 1.5rem 1.5rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    @media (max-width: 640px) {
      .delete-modal {
        width: 95%;
        margin: 1rem;
      }

      .modal-header {
        padding: 1rem;
      }

      .modal-body {
        padding: 1rem;
      }

      .modal-footer {
        padding: 1rem;
        flex-direction: column;
      }

      .header-icon {
        width: 40px;
        height: 40px;
      }

      .warning-icon {
        font-size: 1.25rem;
      }
    }
  `]
})
export class DeleteConfirmationComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() message = '';
  @Input() itemName = '';
  @Input() confirmText = '';
  @Input() showWarning = true;
  @Input() loading = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  onOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}

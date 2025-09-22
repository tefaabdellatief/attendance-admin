import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iv-overlay" [class.visible]="visible" (click)="onOverlayClick($event)">
      <div class="iv-modal" [class.visible]="visible" (click)="$event.stopPropagation()">
        <button class="iv-close" type="button" (click)="close.emit()" aria-label="إغلاق">×</button>
        <div class="iv-body">
          <img *ngIf="src; else noimg" [src]="src" [alt]="alt || 'image'"/>
          <ng-template #noimg>
            <div class="iv-empty">لا توجد صورة لعرضها</div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .iv-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:100000;opacity:0;visibility:hidden;transition:opacity .2s ease}
    .iv-overlay.visible{opacity:1;visibility:visible}
    .iv-modal{position:relative;background:#fff;border-radius:12px;max-width:min(95vw,1000px);max-height:90vh;box-shadow:0 20px 60px rgba(0,0,0,.3);transform:translateY(10px);opacity:0;transition:all .2s ease;overflow:hidden}
    .iv-modal.visible{transform:translateY(0);opacity:1}
    .iv-close{position:absolute;top:.5rem;left:.5rem;background:rgba(0,0,0,.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer}
    .iv-close:hover{background:rgba(0,0,0,.6)}
    .iv-body{padding:0;background:#000;display:flex;align-items:center;justify-content:center;max-height:90vh}
    .iv-body img{display:block;max-width:95vw;max-height:90vh;width:auto;height:auto}
    .iv-empty{padding:2rem;color:#fff}
  `]
})
export class ImageViewerComponent {
  @Input() visible = false;
  @Input() src: string | null = null;
  @Input() alt: string | null = null;
  @Output() close = new EventEmitter<void>();

  onOverlayClick(evt: MouseEvent) {
    const target = evt.target as HTMLElement;
    if (target?.classList.contains('iv-overlay')) this.close.emit();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.visible) {
      e.preventDefault();
      this.close.emit();
    }
  }
}

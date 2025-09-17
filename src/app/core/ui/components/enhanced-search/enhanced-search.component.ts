import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-enhanced-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="enhanced-search-container" [class.focused]="isFocused" [class.has-value]="hasValue">
      <div class="search-input-wrapper">
        <input
          type="text"
          [(ngModel)]="value"
          (ngModelChange)="onValueChange($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown.enter)="onEnter()"
          (keydown.escape)="onEscape()"
          [placeholder]="placeholder"
          [disabled]="disabled"
          class="search-input"
          autocomplete="off">
        
        <div class="search-icons">
          <span class="search-icon" *ngIf="!hasValue && !isFocused">🔍</span>
          <button 
            type="button" 
            class="clear-button" 
            *ngIf="hasValue && !disabled"
            (click)="clearSearch()"
            [attr.aria-label]="'مسح البحث'">
            ✕
          </button>
        </div>
      </div>
      
      <!-- Search suggestions dropdown (optional) -->
      <div class="search-suggestions" *ngIf="showSuggestions && suggestions.length > 0">
        <div 
          class="suggestion-item" 
          *ngFor="let suggestion of suggestions; trackBy: trackBySuggestion"
          (click)="selectSuggestion(suggestion)">
          {{ suggestion }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .enhanced-search-container {
      position: relative;
      width: 100%;
      max-width: 500px;
      transition: all 0.3s ease;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 25px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .enhanced-search-container.focused .search-input-wrapper {
      border-color: #f6b819;
      box-shadow: 0 0 0 3px rgba(246, 184, 25, 0.1);
      transform: translateY(-1px);
    }

    .enhanced-search-container.has-value .search-input-wrapper {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .search-input {
      flex: 1;
      padding: 0.875rem 1.25rem 0.875rem 1.25rem;
      border: none;
      outline: none;
      background: transparent;
      font-size: 1rem;
      color: #1e293b;
      direction: rtl;
      text-align: right;
      transition: all 0.3s ease;
    }

    .search-input::placeholder {
      color: #94a3b8;
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }

    .enhanced-search-container.focused .search-input::placeholder {
      color: #64748b;
      transform: translateX(-5px);
    }

    .search-icons {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .search-icon {
      color: #94a3b8;
      font-size: 1.1rem;
      transition: all 0.3s ease;
    }

    .enhanced-search-container.focused .search-icon {
      color: #f6b819;
      transform: scale(1.1);
    }

    .clear-button {
      background: #f1f5f9;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748b;
      font-size: 0.8rem;
      transition: all 0.2s ease;
      opacity: 0.7;
    }

    .clear-button:hover {
      background: #e2e8f0;
      color: #475569;
      opacity: 1;
      transform: scale(1.1);
    }

    .search-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      margin-top: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
      animation: slideDown 0.2s ease;
    }

    .suggestion-item {
      padding: 0.75rem 1.25rem;
      cursor: pointer;
      color: #374151;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      border-bottom: 1px solid #f1f5f9;
    }

    .suggestion-item:last-child {
      border-bottom: none;
    }

    .suggestion-item:hover {
      background: #f8fafc;
      color: #1e293b;
    }

    .suggestion-item:active {
      background: #e2e8f0;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .enhanced-search-container {
        max-width: 100%;
      }
      
      .search-input {
        font-size: 0.95rem;
        padding: 0.75rem 1rem 0.75rem 1rem;
      }
      
      .search-icons {
        left: 0.75rem;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .search-input-wrapper {
        background: #1e293b;
        border-color: #334155;
      }
      
      .search-input {
        color: #f1f5f9;
      }
      
      .search-input::placeholder {
        color: #64748b;
      }
      
      .search-suggestions {
        background: #1e293b;
        border-color: #334155;
      }
      
      .suggestion-item {
        color: #cbd5e1;
        border-bottom-color: #334155;
      }
      
      .suggestion-item:hover {
        background: #334155;
        color: #f1f5f9;
      }
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EnhancedSearchComponent),
      multi: true
    }
  ]
})
export class EnhancedSearchComponent implements ControlValueAccessor {
  @Input() placeholder: string = 'البحث...';
  @Input() disabled: boolean = false;
  @Input() suggestions: string[] = [];
  @Input() showSuggestions: boolean = false;
  @Output() search = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();
  @Output() suggestionSelected = new EventEmitter<string>();

  value: string = '';
  isFocused: boolean = false;

  private onChange = (value: string) => {};
  private onTouched = () => {};

  get hasValue(): boolean {
    return !!(this.value && this.value.trim().length > 0);
  }

  onValueChange(value: string): void {
    this.value = value;
    this.onChange(value);
    this.search.emit(value);
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
  }

  onEnter(): void {
    this.search.emit(this.value);
  }

  onEscape(): void {
    this.clearSearch();
  }

  clearSearch(): void {
    this.value = '';
    this.onChange('');
    this.clear.emit();
    this.search.emit('');
  }

  selectSuggestion(suggestion: string): void {
    this.value = suggestion;
    this.onChange(suggestion);
    this.suggestionSelected.emit(suggestion);
    this.search.emit(suggestion);
  }

  trackBySuggestion(index: number, suggestion: string): string {
    return suggestion;
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

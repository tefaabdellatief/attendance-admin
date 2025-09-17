import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="input-container" [class.has-error]="error">
      <label *ngIf="label" [for]="id" class="input-label">
        {{ label }}
        <span *ngIf="required" class="required-mark">*</span>
      </label>
      
      <div class="input-wrapper">
        <div *ngIf="iconLeft" class="input-icon input-icon-left">
          <ng-content select="[icon-left]"></ng-content>
        </div>
        
        <input
          [type]="type"
          [id]="id"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [required]="required"
          [min]="min"
          [max]="max"
          [class.has-icon-left]="iconLeft"
          [class.has-icon-right]="iconRight"
          [(ngModel)]="value"
          (blur)="onTouched()"
          (input)="onInputChange($event)"
        />
        
        <div *ngIf="iconRight" class="input-icon input-icon-right">
          <ng-content select="[icon-right]"></ng-content>
        </div>
      </div>
      
      <div *ngIf="error" class="input-error">{{ error }}</div>
      <div *ngIf="hint && !error" class="input-hint">{{ hint }}</div>
    </div>
  `,
  styles: [`
    .input-container {
      margin-bottom: 1rem;
    }
    
    .input-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-color);
    }
    
    .required-mark {
      color: var(--color-danger);
      margin-left: 2px;
    }
    
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background-color: #fff;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    
    input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(246, 184, 25, 0.2);
      outline: none;
    }
    
    input::placeholder {
      color: var(--text-color-light);
      opacity: 0.7;
    }
    
    input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.7;
    }
    
    input.has-icon-left {
      padding-left: 2.5rem;
    }
    
    input.has-icon-right {
      padding-right: 2.5rem;
    }
    
    .input-icon {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 2.5rem;
      color: var(--text-color-light);
    }
    
    .input-icon-left {
      left: 0;
    }
    
    .input-icon-right {
      right: 0;
    }
    
    .input-error {
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: var(--color-danger);
    }
    
    .input-hint {
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: var(--text-color-light);
    }
    
    .has-error input {
      border-color: var(--color-danger);
    }
    
    .has-error input:focus {
      box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() type = 'text';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() id = `input-${Math.random().toString(36).substring(2, 9)}`;
  @Input() disabled = false;
  @Input() required = false;
  @Input() error = '';
  @Input() hint = '';
  @Input() min: number | string | null = null;
  @Input() max: number | string | null = null;
  @Input() iconLeft = false;
  @Input() iconRight = false;
  
  @Output() valueChange = new EventEmitter<string>();
  
  private _value = '';
  
  get value(): string {
    return this._value;
  }
  
  set value(val: string) {
    this._value = val;
    this.onChange(val);
    this.valueChange.emit(val);
  }
  
  onChange: any = () => {};
  onTouched: any = () => {};
  
  writeValue(value: string): void {
    this._value = value || '';
  }
  
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
  }
}
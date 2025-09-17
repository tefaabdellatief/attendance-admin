import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="select-container" [class.has-error]="error">
      <label *ngIf="label" [for]="id" class="select-label">
        {{ label }}
        <span *ngIf="required" class="required-mark">*</span>
      </label>
      
      <div class="select-wrapper">
        <select
          [id]="id"
          [name]="name"
          [(ngModel)]="value"
          (ngModelChange)="onChange($event)"
          (blur)="onTouched()"
          [disabled]="disabled"
          [required]="required"
          [class.has-icon]="icon"
        >
          <option *ngIf="placeholder" [ngValue]="null" disabled selected>
            {{ placeholder }}
          </option>
          <ng-container *ngIf="options">
            <option 
              *ngFor="let option of options" 
              [ngValue]="optionValue ? option[optionValue] : option"
              [disabled]="option.disabled"
            >
              {{ optionLabel ? option[optionLabel] : option }}
            </option>
          </ng-container>
          <ng-content></ng-content>
        </select>
        
        <div *ngIf="icon" class="select-icon">
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>
      
      <div *ngIf="error" class="select-error">{{ error }}</div>
      <div *ngIf="hint && !error" class="select-hint">{{ hint }}</div>
    </div>
  `,
  styles: [`
    .select-container {
      margin-bottom: 1rem;
      font-family: var(--font-family);
    }
    
    .select-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
      color: var(--text-color);
      
      .required-mark {
        color: #ef4444;
        margin-right: 0.25rem;
      }
    }
    
    .select-wrapper {
      position: relative;
      
      select {
        width: 100%;
        padding: 0.5rem 2.5rem 0.5rem 1rem;
        font-size: 1rem;
        line-height: 1.5;
        color: var(--text-color);
        background-color: #fff;
        background-image: none;
        border: 1px solid var(--border-color);
        border-radius: 0.375rem;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        appearance: none;
        
        &:focus {
          outline: 0;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
        }
        
        &:disabled {
          background-color: #e9ecef;
          opacity: 1;
          cursor: not-allowed;
        }
        
        &.has-icon {
          padding-right: 3rem;
        }
      }
      
      .select-icon {
        position: absolute;
        top: 50%;
        left: 0.75rem;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--muted-text);
      }
    }
    
    .select-error {
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: #dc2626;
    }
    
    .select-hint {
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: var(--muted-text);
    }
    
    .has-error {
      .select-label {
        color: #dc2626;
      }
      
      select {
        border-color: #dc2626;
        
        &:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 0.2rem rgba(220, 38, 38, 0.25);
        }
      }
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ]
})
export class SelectComponent implements ControlValueAccessor {
  @Input() id = `select-${Math.random().toString(36).substring(2, 9)}`;
  @Input() name = '';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() error = '';
  @Input() hint = '';
  @Input() icon = false;
  @Input() options: any[] = [];
  @Input() optionLabel = '';
  @Input() optionValue = '';
  
  @Output() valueChange = new EventEmitter<any>();
  
  private _value: any = null;
  public onChange: (value: any) => void = () => {};
  public onTouched: () => void = () => {};
  
  get value(): any {
    return this._value;
  }
  
  set value(val: any) {
    if (val !== this._value) {
      this._value = val;
      this.onChange(val);
      this.valueChange.emit(val);
    }
  }
  
  writeValue(value: any): void {
    this._value = value;
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
}

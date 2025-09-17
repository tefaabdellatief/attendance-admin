import { Directive, ElementRef, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Directive({
  selector: '[appPageTransition]',
  standalone: true
})
export class PageTransitionDirective implements OnInit {
  constructor(private el: ElementRef, private router: Router) {}

  ngOnInit() {
    // Add initial classes
    this.el.nativeElement.classList.add('page-transition');
    
    // Listen for route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Apply transition effect
        this.el.nativeElement.classList.add('page-transition-active');
        
        // Remove the class after animation completes
        setTimeout(() => {
          this.el.nativeElement.classList.remove('page-transition-active');
        }, 300);
      });
  }
}
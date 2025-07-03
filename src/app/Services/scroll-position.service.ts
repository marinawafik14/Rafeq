import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ScrollPositionService {
  private scrollPositions: { [key: string]: number } = {};

  constructor() {}

  saveScrollPosition(routePath: string, position: number): void {
    this.scrollPositions[routePath] = position;
  }

  getScrollPosition(routePath: string): number {
    return this.scrollPositions[routePath] || 0;
  }

  clearScrollPosition(routePath: string): void {
    delete this.scrollPositions[routePath];
  }

  getCurrentScrollPosition(): number {
    return (
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    );
  }

  scrollToPosition(position: number): void {
    setTimeout(() => {
      window.scrollTo({
        top: position,
        behavior: 'smooth',
      });
    }, 100);
  }
}

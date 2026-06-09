import { Injectable, signal } from '@angular/core';

export interface ToastData {
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly currentToast = signal<ToastData | null>(null);

  show(message: string, type: 'success' | 'error' = 'success'): void {
    this.currentToast.set({ message, type });
    setTimeout(() => {
      // Only clear if this specific toast is still active
      if (this.currentToast()?.message === message) {
        this.clear();
      }
    }, 4000);
  }

  clear(): void {
    this.currentToast.set(null);
  }
}
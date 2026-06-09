import { Component, inject } from '@angular/core';
import { ToastService } from '../../../services/toast/toast-service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  protected toastService = inject(ToastService);
}
import { Component, inject } from '@angular/core';
import { ModalRef } from '../../services/modal/modal-ref';

@Component({
  selector: 'app-modal-shell',
  imports: [],
  templateUrl: './modal-shell.html',
  styleUrl: './modal-shell.css',
})
export class ModalShell {
  modalRef = inject(ModalRef);
}

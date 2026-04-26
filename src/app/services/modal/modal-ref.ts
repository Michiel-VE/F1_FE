import { OverlayRef } from '@angular/cdk/overlay';

export class ModalRef {
  constructor(private overlayRef: OverlayRef) {}

  close(result?: unknown): void {
    this.overlayRef.dispose();
  }
}
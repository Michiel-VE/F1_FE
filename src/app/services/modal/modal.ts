import { Injectable, Injector } from '@angular/core';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { ModalRef } from './modal-ref';

@Injectable({ providedIn: 'root' })
export class ModalService {
  constructor(
    private overlay: Overlay,
    private injector: Injector,
  ) {}

  open<T>(component: ComponentType<T>, data?: unknown): ModalRef {
    const overlayRef = this.overlay.create(this.getOverlayConfig());
    const modalRef = new ModalRef(overlayRef);

    const injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: ModalRef, useValue: modalRef },
        { provide: MODAL_DATA, useValue: data },
      ],
    });

    overlayRef.attach(new ComponentPortal(component, null, injector));

    // Close on backdrop click
    overlayRef.backdropClick().subscribe(() => modalRef.close());

    overlayRef
      .keydownEvents()
      .pipe(filter((e:KeyboardEvent) => e.key === 'Escape'))
      .subscribe(() => modalRef.close());

    return modalRef;
  }

  private getOverlayConfig(): OverlayConfig {
    return new OverlayConfig({
      hasBackdrop: true,
      backdropClass: 'modal-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    });
  }
}

import { InjectionToken } from '@angular/core';
import { filter } from 'rxjs';
export const MODAL_DATA = new InjectionToken<unknown>('MODAL_DATA');

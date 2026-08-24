import { CdkPortalOutlet, TemplatePortal } from '@angular/cdk/portal';
import { CdkStep } from '@angular/cdk/stepper';
import {
	ChangeDetectionStrategy,
	Component,
	contentChild,
	DestroyRef,
	effect,
	inject,
	input,
	signal,
	untracked,
	ViewContainerRef,
} from '@angular/core';
import { SpartanStepContent } from './spartan-step-content';
import { SpartanStepLabel } from './spartan-step-label';

@Component({
	selector: 'spartan-step',
	exportAs: 'spartanStep',
	imports: [CdkPortalOutlet],
	providers: [
		{
			provide: CdkStep,
			useExisting: SpartanStep,
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		hidden: '',
	},
	template: `
		<ng-template>
			<ng-content></ng-content>
			<ng-template [cdkPortalOutlet]="portal()"></ng-template>
		</ng-template>
	`,
})
export class SpartanStep extends CdkStep {
	private readonly _viewContainerRef = inject(ViewContainerRef);
	private readonly _destroyRef = inject(DestroyRef);

	public readonly icon = input<string | null>(null);

	/** Content for step label given by `<ng-template SpartanStepLabel>`. */
	public readonly stepLabelContent = contentChild(SpartanStepLabel);

	/** Content that will be rendered lazily. */
	private readonly _lazyContent = contentChild(SpartanStepContent);

	/** Currently-attached portal containing the lazy content. */
	public readonly portal = signal<TemplatePortal | null>(null);

	constructor() {
		super();

		effect(() => {
			const isSelected = this.isSelected();
			const lazyContent = this._lazyContent();

			untracked(() => {
				if (isSelected && lazyContent && !this.portal()) {
					this.portal.set(new TemplatePortal(lazyContent.template, this._viewContainerRef));
				}
			});
		});

		this._destroyRef.onDestroy(() => {
			const portal = this.portal();
			if (portal?.isAttached) {
				portal.detach();
			}
		});
	}
}

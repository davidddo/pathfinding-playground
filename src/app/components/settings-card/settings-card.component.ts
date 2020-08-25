import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ChangeDetectionStrategy } from '@angular/core';
import { trigger, style, transition, animate } from '@angular/animations';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaintingService } from '../../services';
import { Algorithm, PaintingMode, Settings } from '../../models';
import { algorithms } from '../../pathfinding/algorithms';

@Component({
  selector: 'settings-card',
  templateUrl: './settings-card.component.html',
  animations: [
    trigger('openCloseCard', [
      transition(':enter', [
        style({
          right: '-400%',
        }),
        animate(
          '.25s ease-in-out',
          style({
            right: 0,
          })
        ),
      ]),
      transition(':leave', [
        animate(
          '.25s ease-in-out',
          style({
            right: '-400%',
          })
        ),
      ]),
    ]),
    trigger('showHideButton', [
      transition(':enter', [
        style({
          opacity: 0,
        }),
        animate(
          '.1s ease-in-out',
          style({
            opacity: 1,
          })
        ),
      ]),
      transition(':leave', [
        animate(
          '.1s ease-in-out',
          style({
            opacity: 0,
          })
        ),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCardComponent implements OnInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();

  @Input() settings: Settings;
  @Output() settingsChange: EventEmitter<Partial<Settings>> = new EventEmitter<Partial<Settings>>();
  @Output() visualizePath: EventEmitter<void> = new EventEmitter<void>();
  @Output() generateMaze: EventEmitter<void> = new EventEmitter<void>();

  settingsForm: FormGroup;
  algorithms: Algorithm[] = algorithms;

  isHidden = true;

  constructor(private formBuilder: FormBuilder, private paintingService: PaintingService) {}

  ngOnInit() {
    if (this.settings) {
      this.settingsForm = this.formBuilder.group({
        algorithmId: [this.settings.algorithmId],
        speed: [this.settings.speed],
      });
    }

    this.paintingService.isMouseLocked$.pipe(takeUntil(this.destroy$)).subscribe((isMouseLocked) => {
      if (isMouseLocked) {
        this.isHidden = true;
      }
    });

    this.settingsForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((changes) => this.settingsChange.emit(changes));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  showChard() {
    this.isHidden = false;
  }

  onVisualize() {
    this.isHidden = true;
    this.visualizePath.emit();
  }

  onGenerateMaze() {
    this.generateMaze.emit();
  }

  switchPaintingMode(mode: keyof typeof PaintingMode) {
    this.paintingService.updateMode(PaintingMode[mode]);
  }

  formatSpeedLabel(value: number) {
    return value + '%';
  }
}

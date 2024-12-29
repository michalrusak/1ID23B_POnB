import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { PhotoService } from 'src/app/modules/core/services/photo.service';
import { PhotoStateService } from 'src/app/modules/core/services/photo.state';

@Component({
  selector: 'app-add-photo',
  templateUrl: './add-photo.component.html',
  styleUrls: ['./add-photo.component.scss'],
})
export class AddPhotoComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  state$ = this.photoState.getState();

  constructor(
    private photoService: PhotoService,
    private photoState: PhotoStateService
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!this.validateFile(file)) {
      this.photoState.setError(
        'Please select a valid image file (jpg, png, gif) under 5MB'
      );
      return;
    }

    this.photoState.reset();
    this.photoState.setUploading(true);

    this.photoService.uploadAndProcessPhoto(file).subscribe({
      next: () => {
        this.photoState.setProgress(100);
        this.photoState.setSuccess(
          'Photo successfully uploaded and processed on blockchain'
        );
      },
      error: (error) => {
        this.photoState.setError(error.message || 'Failed to process photo');
      },
      complete: () => {
        this.photoState.setUploading(false);
      },
    });
  }

  private validateFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

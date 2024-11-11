import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PhotoService, Photo } from 'src/app/modules/core/services/photo.service';

@Component({
  selector: 'app-add-photo',
  templateUrl: './add-photo.component.html',
  styleUrls: ['./add-photo.component.scss']
})
export class AddPhotoComponent {
  photoForm: FormGroup;

  constructor(private fb: FormBuilder, private photoService: PhotoService) {
    this.photoForm = this.fb.group({
      title: ['', Validators.required],
      url: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.photoForm.valid) {
      const newPhoto: Photo = {
        id: Date.now().toString(), // Generowanie unikalnego ID
        ...this.photoForm.value
      };
      this.photoService.addPhoto(newPhoto);
      this.photoForm.reset();
    }
  }
}

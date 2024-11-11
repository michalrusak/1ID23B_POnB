import { Component, OnInit } from '@angular/core';
import { Photo, PhotoService } from 'src/app/modules/core/services/photo.service';


@Component({
  selector: 'app-photo-list',
  templateUrl: './photo-list.component.html',
  styleUrls: ['./photo-list.component.scss']
})
export class PhotoListComponent implements OnInit {
  photos: Photo[] = [];

  constructor(private photoService: PhotoService) {}

  ngOnInit(): void {
    this.photoService.photos.subscribe((photos) => {
      this.photos = photos;
    });
    this.photoService.fetchPhotos();
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface Photo {
  id: string;
  url: string;
  title: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private photosUrl = 'https://api.example.com/photos'; 
  private photos$ = new BehaviorSubject<Photo[]>([]);

  constructor(private http: HttpClient) {}

  get photos(): Observable<Photo[]> {
    return this.photos$.asObservable();
  }

  fetchPhotos(): void {
    this.http.get<Photo[]>(this.photosUrl).subscribe((photos) => {
      this.photos$.next(photos);
    });
  }

  addPhoto(photo: Photo): void {
    this.http.post<Photo>(this.photosUrl, photo).subscribe(() => {
      this.fetchPhotos(); 
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { ImageResponse, BlockchainResponse } from '../models/models';
import { AuthService } from './auth.service';

export interface Photo {
  id: string;
  url: string;
  title: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private readonly apiUrl = environment.apiURL;
  private photos$ = new BehaviorSubject<any[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  get photos(): Observable<any[]> {
    return this.photos$.asObservable();
  }

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `${this.authService.token}`
    });
  }

  uploadPhoto(file: File): Observable<ImageResponse> {
    const formData = new FormData();
    formData.append('image', file);

    // First, upload to user system
    return this.http.post<ImageResponse>(
      `${this.apiUrl}/user/upload-image`,
      formData,
      { headers: this.authHeaders }
    ).pipe(
      tap(() => this.processPhotoInBlockchain(file))
    );
  }

  private processPhotoInBlockchain(file: File): Observable<ImageResponse> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<ImageResponse>(
      `${this.apiUrl}/blockchain/image/process`,
      formData
    );
  }

  mineBlock(): Observable<BlockchainResponse> {
    return this.http.get<BlockchainResponse>(
      `${this.apiUrl}/blockchain/mine`
    );
  }

  getBlockchain(): Observable<BlockchainResponse> {
    return this.http.get<BlockchainResponse>(
      `${this.apiUrl}/blockchain/chain`
    );
  }

  simulateFailure(type: 'node_down' | 'network_delay' | 'data_corruption'): Observable<BlockchainResponse> {
    return this.http.post<BlockchainResponse>(
      `${this.apiUrl}/blockchain/simulate/failure`,
      { type }
    );
  }
}
import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SongComponent } from '../../shared/components/song/song.component';
import { CommonModule } from '@angular/common';
import {
  Observable,
  filter,
  map,
  of,
  shareReplay,
  switchMap,
  take,
} from 'rxjs';
import { ArtistComponent } from '../../shared/components/artist-card/artist-card.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { PlayButtonComponent } from '../../shared/components/play-button/play-button.component';
import { PlayerService } from '../../core/services/audio.service';
import { SongService } from '../../core/services/song.service';
import { AlbumBrief } from '../../shared/interfaces/album.interface';
import { Artist } from '../../shared/interfaces/artist.interface';
import { Playlist } from '../../shared/interfaces/playlist.interface';
import { Song } from '../../shared/interfaces/song.interface';
import { CookieService } from '../../core/services/cookie.service';
import { UserService } from '../../core/services/user.service';
import { UserMusicService } from '../../core/services/user-music.service';
import { AlbumCardComponent } from '../../shared/components/album-card/album-card.component';

@Component({
  selector: 'app-artist-page',
  standalone: true,
  templateUrl: './artist-page.component.html',
  styleUrl: './artist-page.component.css',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SongComponent,
    CommonModule,
    AlbumCardComponent,
    ArtistComponent,
    LoaderComponent,
    PlayButtonComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ArtistPageComponent implements OnInit {
  public artist$!: Observable<Artist>;
  public albums$!: Observable<AlbumBrief[] | null>;
  public related$!: Observable<Artist[] | null>;
  public playlists$!: Observable<Playlist[] | null>;
  public isFavorite: boolean = false;
  public isPlaying: boolean = false;
  public songs: Song[] = [];
  public requests!: number;
  public lastIndex: number = 7;

  constructor(
    private activateRoute: ActivatedRoute,
    private api: ApiService,
    private player: PlayerService,
    private songData: SongService,
    private cookie: CookieService,
    private userService: UserService,
    private userMusic: UserMusicService
  ) { }

  ngOnInit(): void {
    this.onResize({ target: { innerWidth: window.innerWidth } });

    this.player.audioChanges
      .pipe(filter((el) => el.type === 'time'))
      .subscribe((el) => {
        this.isPlaying = el.data && this.songData.compareQueues(this.songs);
      });

    this.activateRoute.params.subscribe((params) => {
      this.albums$ = of(null);
      this.related$ = of(null);
      this.playlists$ = of(null);
      this.songs = [];

      this.requests = 4;
      const id = Number(params['id']);

      this.artist$ = this.api.getArtist(id).pipe(shareReplay(1));
      this.markIsFavorite();
      this.artist$
        .pipe(
          switchMap((artist: Artist) => this.api.getArtistTop(artist.id, 5))
        )
        .subscribe((res) => {
          this.requests--;
          this.songs = res.data;
          this.isPlaying =
            !this.player.getAudio().paused &&
            this.songData.compareQueues(this.songs);
        });
      this.albums$ = this.artist$.pipe(
        switchMap((artist: Artist) =>
          this.api
            .getArtistAlbums(artist.id, 7)
            .pipe(map((res) => this.sortByDate(res.data)))
        )
      );
      this.related$ = this.artist$.pipe(
        switchMap((artist: Artist) =>
          this.api.getArtistRelated(artist.id, 7).pipe(map((res) => res.data))
        )
      );
      this.playlists$ = this.artist$.pipe(
        switchMap((artist: Artist) =>
          this.api
            .getPlaylistsWithArtist(artist.id)
            .pipe(map((res) => res.data))
        )
      );

      this.albums$.subscribe(() => {
        this.requests--;
      });
      this.related$.subscribe(() => {
        this.requests--;
      });
      this.playlists$.subscribe(() => {
        this.requests--;
      });
    });
  }

  get favoriteIcon(): string {
    return this.isFavorite ? 'heart' : 'heart-outline';
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const width = event.target.innerWidth;
    if (width >= 1600) {
      this.lastIndex = 7;
    } else if (width >= 1400) {
      this.lastIndex = 6;
    } else if (width >= 1000) {
      this.lastIndex = 5;
    } else {
      this.lastIndex = 7;
    }
  }

  private sortByDate(arr: AlbumBrief[]): AlbumBrief[] {
    return arr.sort((a, b) => {
      const date1 = new Date(a.release_date);
      const date2 = new Date(b.release_date);
      if (date1 > date2) return -1;
      else if (date1 < date2) return 1;
      else return 0;
    });
  }

  private markIsFavorite() {
    this.artist$.pipe(take(1)).subscribe((artist) => {
      this.userMusic.getMusic().subscribe((music) => {
        this.isFavorite = music.some((e) => e.id === artist.id);
      });
    });
  }

  addToFavorite() {
    this.artist$.pipe(take(1)).subscribe((artist) => {
      const token = this.cookie.get('access_token');
      this.userService.addToFavotiteArtist(artist, token).subscribe((user) => {
        if (!user.id) return;
        this.isFavorite = !this.isFavorite;
        const favoriteSongsCollection = this.userMusic.getMusic().getValue()[0];
        this.userMusic.setMusic([
          favoriteSongsCollection,
          ...user.favoritePlaylists,
          ...user.favoriteAlbums,
          ...user.favoriteArtists,
        ]);
      });
    });
  }
}

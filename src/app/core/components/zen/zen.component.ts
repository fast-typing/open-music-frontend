import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AudioService } from '../../services/audio.service';
import { MatIconModule } from '@angular/material/icon';
import { SongService } from '../../services/song.service';
import { ControlsComponent } from '../../../shared/components/controls/controls.component';
import { filter } from 'rxjs';
import { RouterLink } from '@angular/router';
import { SliderTimeComponent } from '../../../shared/components/slider-time/slider-time.component';
import { VolumeEditorComponent } from '../../../shared/components/volume-editor/volume-editor.component';
import { Song } from '../../../shared/interfaces/song.interface';

@Component({
  selector: 'app-zen',
  standalone: true,
  templateUrl: './zen.component.html',
  styleUrl: './zen.component.css',
  imports: [
    MatIconModule,
    ControlsComponent,
    RouterLink,
    SliderTimeComponent,
    VolumeEditorComponent,
  ],
})
export class ZenComponent implements OnInit {
  @Output() zenClose = new EventEmitter<boolean>();
  public song: Song | null = null;
  public duration: number = 0;
  public currentTime: number = 0;
  public prevSongCover!: string;

  constructor(private player: AudioService, private songData: SongService) {}

  ngOnInit(): void {
    this.updateSong();

    //!!!!!!!!!! this.songData.changes
    //   .pipe(filter((el) => el === 'song'))
    //   .subscribe((el) => {
    //     this.updateSong();
    //   });

    this.player.getAudio().addEventListener('timeupdate', () => {
      this.currentTime = this.player.getAudio().currentTime;
    });

    this.player.getAudio().onloadedmetadata = () => {
      this.duration = Number(this.player.getAudio().duration.toFixed(1));
    };
  }

  hideZen() {
    this.zenClose.emit(false);
  }

  updateSong() {
    this.prevSongCover = this.song?.album.cover_xl ?? '';
    const currentSong = this.songData.getSong();
    if (!currentSong) return;
    this.song = currentSong;
  }
}

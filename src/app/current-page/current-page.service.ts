import { Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrentPageService {

  eventEmitter: EventEmitter<any> = new EventEmitter();

  emitPages(pages) {
    this.eventEmitter.emit(pages)
  }

  constructor() { }
}

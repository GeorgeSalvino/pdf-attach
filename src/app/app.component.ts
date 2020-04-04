import { Component, OnInit } from '@angular/core';
import { CurrentPageService } from './current-page/current-page.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'pdf-attach';

  previewPages;

  constructor(private currentPageService: CurrentPageService) {}
  ngOnInit(): void {
    this.currentPageService.eventEmitter.subscribe((pages) => this.previewPages = pages)
  }

}

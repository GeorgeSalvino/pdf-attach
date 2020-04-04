import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewChildren } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormGroup, FormControl } from '@angular/forms';
import { CurrentPageService } from '../current-page/current-page.service';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';


import { PDFDocument, PDFEmbeddedPage, PDFPage } from 'pdf-lib';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewComponent implements OnInit {

  previewPages = [this.sanitizer.bypassSecurityTrustUrl(''), this.sanitizer.bypassSecurityTrustUrl(''),
   this.sanitizer.bypassSecurityTrustUrl('')]

  @ViewChild('theCanvas') canvas: ElementRef;


  canvas1: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D ;

  constructor(private sanitizer: DomSanitizer, private currentPageService: CurrentPageService) { }

  ngOnInit(): void {
    this.currentPageService.eventEmitter.subscribe((pages) => {
      this.displayPdfJs(pages)
    })
  }

  async displayPdfJs(doc: PDFDocument) {
    let pdf64 = await doc.save();
    //let pdfData = atob(pdf64);

    let loadingTask = pdfjsLib.getDocument({data: pdf64});
    loadingTask.promise.then((pdf) => {
      this.canvas1 = this.canvas.nativeElement;
      this.ctx = this.canvas1.getContext('2d');
      console.log('PDF loaded');

      let pageNumber = 1;
      pdf.getPage(pageNumber).then((page) => {
        console.log('Page loaded');

        let scale = 1.0;
        let viewport = page.getViewport({scale: scale});

        // Prepare canvas using PDF page dimensions
        /* let canvas: HTMLCanvasElement = document.getElementById('the-canvas').;
        let context = canvas.getContext('2d'); */
        this.canvas1.height = viewport.height;
        this.canvas1.width = viewport.width;

        let renderContext = {
          canvasContext: this.ctx,
          viewport: viewport
        };

        let renderTask = page.render(renderContext);
        renderTask.promise.then(() => {
          console.log('Page rendered');
        });
      })
    }, (err) => console.error(err))
  }

}

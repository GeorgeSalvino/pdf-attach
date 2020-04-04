import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewChildren } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { PDFDocument, PDFEmbeddedPage, PDFPage } from 'pdf-lib';
import { DomSanitizer } from '@angular/platform-browser';
import { PreviewComponent } from '../preview/preview.component';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { CurrentPageService } from './current-page.service';

@Component({
  selector: 'app-current-page',
  templateUrl: './current-page.component.html',
  styleUrls: ['./current-page.component.css']
})
export class CurrentPageComponent implements OnInit, AfterViewInit {


  fileForm = new FormGroup({
    fileUpload: new FormControl(''),
  });

  pdf64 = this.sanitizer.bypassSecurityTrustUrl('');

  @ViewChild('fileInput') fileInput: ElementRef;
  @ViewChild('theCanvas') canvas: ElementRef;
  @ViewChild('leftCanvas') leftCanvas: ElementRef;
  @ViewChild('middleCanvas') middleCanvas: ElementRef;
  @ViewChild('rightCanvas') rightCanvas: ElementRef;

  canvas1: HTMLCanvasElement;
  canvas2: HTMLCanvasElement;
  canvas3: HTMLCanvasElement;
  canvas4: HTMLCanvasElement;
  ctx1: CanvasRenderingContext2D ;
  ctx2: CanvasRenderingContext2D ;
  ctx3: CanvasRenderingContext2D ;
  ctx4: CanvasRenderingContext2D ;



  currentIndex = 0;

  srcPdf: PDFDocument;

  currentPageNumber = 0;
  numberOfPages = 0;

  previewPages: PDFPage[] = [ , , ];

  constructor(private sanitizer: DomSanitizer, private currentPageService: CurrentPageService) {}

  ngAfterViewInit(): void {

    console.log(this.ctx1)
  }

  async ngOnInit() {
    this.srcPdf = await PDFDocument.create();
  }

  async copyPage(indexToCopy) {
    let doc = await PDFDocument.create();

    const copiedPage = await doc.copyPages(this.srcPdf, [indexToCopy]);
    doc.insertPage(0, copiedPage[0]);
    return doc;
  }

  async showCurrentPage(doc) {
    const onePagePdfBytes = await doc.saveAsBase64({dataUri: true});
    // tslint:disable-next-line: max-line-length
    this.displayPdfJs(doc);
    this.threePagesPreview()
  }

  async changePage(isNext: boolean, index?) {
    if(isNext === null) {
      this.currentIndex = 0;
      let doc = await this.copyPage(this.currentIndex);

      this.showCurrentPage(doc);

    }
    else if (this.currentIndex !== 0 && !isNext) {
      this.currentIndex--;
      let doc = await this.copyPage(this.currentIndex);

      this.showCurrentPage(doc);
    } else if (!(this.srcPdf.getPageCount() - 1 === this.currentIndex) && isNext) {
      this.currentIndex++;
      let doc = await this.copyPage(this.currentIndex);

      this.showCurrentPage(doc);
    } else if(index) {
      let doc = await this.copyPage(index);

      this.showCurrentPage(doc);
    }
    this.updatePageCounter();


    //console.log(this.currentIndex)
  }

  async deletePage() {
    this.srcPdf.removePage(this.currentIndex);
    let temp = await this.srcPdf.saveAsBase64({dataUri: true});
    this.srcPdf = await PDFDocument.load(temp);
    if(this.srcPdf.getPageCount() === this.currentIndex) {
      this.changePage(null);
      console.log(this.srcPdf.getPageCount())
    } else{
      console.log(this.srcPdf.getPages().length)
      this.currentIndex++
      this.changePage(undefined, this.currentIndex);
    }
  }

  updatePageCounter() {
    this.currentPageNumber = this.currentIndex + 1;
    this.numberOfPages = this.srcPdf.getPageCount();
  }

  async threePagesPreview() {
    let isOnfirst = this.currentIndex === 0;
    let isOnLast = this.currentIndex === this.srcPdf.getPageCount() - 1;

    let doc = await PDFDocument.create();

    if(isOnfirst) {
      this.previewPages[0] = this.srcPdf.getPages()[this.currentIndex]
      this.previewPages[1] = this.srcPdf.getPages()[this.currentIndex + 1]
      this.previewPages[2] = this.srcPdf.getPages()[this.currentIndex + 2]
    } else if(isOnLast) {
      this.previewPages[0] = this.srcPdf.getPages()[this.currentIndex - 2]
      this.previewPages[1] = this.srcPdf.getPages()[this.currentIndex - 1]
      this.previewPages[2] = this.srcPdf.getPages()[this.currentIndex]
    } else {
      this.previewPages[0] = this.srcPdf.getPages()[this.currentIndex - 1]
      this.previewPages[1] = this.srcPdf.getPages()[this.currentIndex]
      this.previewPages[2] = this.srcPdf.getPages()[this.currentIndex + 1]
    }
    const embeddedPage = await doc.embedPages([this.previewPages[0], this.previewPages[1], this.previewPages[2] ] );
    embeddedPage.forEach(element => {
      const page = doc.addPage();
      page.drawPage(element);
    });

    this.previewDisplay(doc);
  }

  async previewDisplay(doc: PDFDocument) {
    this.canvas2 = this.leftCanvas.nativeElement;
    this.canvas3 = this.middleCanvas.nativeElement;
    this.canvas4 = this.rightCanvas.nativeElement;
    this.ctx2 = this.canvas2.getContext('2d');
    this.ctx3 = this.canvas3.getContext('2d');
    this.ctx4 = this.canvas4.getContext('2d');

    let pdf64 = await doc.save();
    //let pdfData = atob(pdf64);

    let loadingTask = pdfjsLib.getDocument({data: pdf64});
    loadingTask.promise.then((pdf) => {

      for(let i = 2; i <= 4; i++) {
        console.log('PDF loaded');

        let pageNumber = i - 1;
        pdf.getPage(pageNumber).then((page) => {
          console.log('Page loaded');

          let scale = 0.2;
          let viewport = page.getViewport({scale: scale});

          this['canvas' + i].height = viewport.height;
          this['canvas' + i].width = viewport.width;

          // Start render here
          let renderContext = {
            canvasContext: this['ctx' + i],
            viewport: viewport
          };

          let renderTask = page.render(renderContext);
          renderTask.promise.then(() => {
          });
        })
      }
    });
  }

  async displayPdfJs(doc: PDFDocument, isPreview?) {
    let pdf64 = await doc.save();

    let loadingTask = pdfjsLib.getDocument({data: pdf64});
    loadingTask.promise.then((pdf) => {

      this.canvas1 = this.canvas.nativeElement;

      this.ctx1 = this.canvas1.getContext('2d');
      console.log('PDF loaded');

      let pageNumber = 1;
      pdf.getPage(pageNumber).then((page) => {
        console.log('Page loaded');

        let scale = 1.0;
        let viewport = page.getViewport({scale: scale});

        this.canvas1.height = viewport.height;
        this.canvas1.width = viewport.width;

        let renderContext = {
          canvasContext: this.ctx1,
          viewport: viewport
        };

        let renderTask = page.render(renderContext);
        renderTask.promise.then(() => {
          this.threePagesPreview();
        });

      })
    }, (err) => console.error(err))


  }

  async loadFile() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = await import('pdfjs-dist/build/pdf.worker.entry');

    let reader = new FileReader();
    await reader.readAsDataURL(this.fileInput.nativeElement.files[0]);
    console.log(reader)
    reader.onload = async () => {
      if(!reader.result.toString().includes('data:image/jpeg')) {
        if(this.srcPdf.getPages().length == 0) {
          this.srcPdf = await PDFDocument.load(reader.result);

          let doc = await this.copyPage(0);

          this.showCurrentPage(doc);
        }
        // tslint:disable-next-line: one-line
        else {
            let doc = await PDFDocument.load(reader.result);
            const embeddedPage = await this.srcPdf.embedPdf(doc, doc.getPageIndices());

            embeddedPage.forEach(element => {
              const page = this.srcPdf.addPage();
              page.drawPage(element);
            });
          }
      }


      this.updatePageCounter();
    };
  }



}

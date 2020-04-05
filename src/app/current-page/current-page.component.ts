import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewChildren } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { PDFDocument, PDFEmbeddedPage, PDFPage, PDFImage } from 'pdf-lib';
import { DomSanitizer } from '@angular/platform-browser';
import { PreviewComponent } from '../preview/preview.component';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { CurrentPageService } from './current-page.service';
import { faTrash, faChevronRight, faChevronLeft, faDownload } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-current-page',
  templateUrl: './current-page.component.html',
  styleUrls: ['./current-page.component.css']
})
export class CurrentPageComponent implements OnInit, AfterViewInit {

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

  faTrash = faTrash;
  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;
  faDownload = faDownload;

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

  async loadTask(readerResult, i) {
    let isJpg = readerResult.toString().includes('data:image/jpeg');
    let isPng = readerResult.toString().includes('data:image/png;');
    if (!isJpg && !isPng) {
        if (this.srcPdf.getPages().length == 0) {
          this.srcPdf = await PDFDocument.load(readerResult);

          let doc = await this.copyPage(0);

          this.showCurrentPage(doc);
        }
        // tslint:disable-next-line: one-line
        else {
            let doc = await PDFDocument.load(readerResult);
            const embeddedPage = await this.srcPdf.embedPdf(doc, doc.getPageIndices());

            embeddedPage.forEach(element => {
              const page = this.srcPdf.addPage();
              page.drawPage(element);
            });
            this.previewDisplay(this.srcPdf);
          }
      } else {
        let embeddedImage: PDFImage;
        let doc = await PDFDocument.create()


        if (this.srcPdf.getPages().length == 0) {
          if (isJpg) {
              embeddedImage = await doc.embedJpg(readerResult);
          } else {
              embeddedImage = await doc.embedPng(readerResult);
          }
          let imageDims = embeddedImage.scale(1)
          let page = doc.addPage()
          page.drawImage(embeddedImage, {
            x: page.getWidth() / 2 - imageDims.width / 2,
            y: page.getHeight() / 2 - imageDims.width / 2,
            width: imageDims.width,
            height: imageDims.height,
          });
          this.srcPdf = doc;
          this.showCurrentPage(doc);

        } else {
          if (isJpg) {
            embeddedImage = await this.srcPdf.embedJpg(readerResult);
          } else {
            embeddedImage = await this.srcPdf.embedPng(readerResult);
          }
          let imageDims = embeddedImage.scale(1)
          let page = this.srcPdf.addPage();
          page.drawImage(embeddedImage, {
            x: page.getWidth() / 2 - imageDims.width / 2,
            y: page.getHeight() / 2 - imageDims.width / 2,
            width: imageDims.width,
            height: imageDims.height,
          });

          let docImg = await this.copyPage(0)

          this.showCurrentPage(docImg);
        }
      }
    this.updatePageCounter();
  }

  readerTask(reader: FileReader, input) {
    return new Promise((resolve, reject) => {
      reader.readAsDataURL(input);
      reader.onload = async () => {
      resolve(reader.result);
    };
    });
  }

  async loadFile() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = await import('pdfjs-dist/build/pdf.worker.entry');

    let reader = new FileReader();
    //
    console.log(this.fileInput.nativeElement.files)
    let input = this.fileInput.nativeElement.files;
    let readerResult;
    for(let i = 0; i < this.fileInput.nativeElement.files.length; i++) {
      readerResult = await this.readerTask(reader, input[i]);

      await this.loadTask(readerResult, i);
    }

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
          console.log('rendered')
          this.threePagesPreview();
        });
      })
    }, (err) => console.error(err))
  }

  async threePagesPreview() {
    let isOnfirst = this.currentIndex === 0;
    let isOnLast = this.currentIndex === this.srcPdf.getPageCount() - 1;

    let doc = await PDFDocument.create();

    if (isOnfirst) {
      this.previewPages[0] = this.srcPdf.getPages()[this.currentIndex]
      this.previewPages[1] = this.srcPdf.getPages()[this.currentIndex + 1]
      this.previewPages[2] = this.srcPdf.getPages()[this.currentIndex + 2]
    } else if (isOnLast) {
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

  async copyPage(indexToCopy) {
    let doc = await PDFDocument.create();

    const copiedPage = await doc.copyPages(this.srcPdf, [indexToCopy]);

    doc.insertPage(0, copiedPage[0]);
    return doc;
  }

  async showCurrentPage(doc) {
    // tslint:disable-next-line: max-line-length
    this.displayPdfJs(doc);
    this.threePagesPreview()
  }

  async changePage(isNext: boolean, index?) {
    let doc;
    if (isNext === null) {
      this.currentIndex = 0;
      doc = await this.copyPage(this.currentIndex);
    }
    else if (this.currentIndex !== 0 && !isNext) {
      this.currentIndex--;
      doc = await this.copyPage(this.currentIndex);

    } else if (!(this.srcPdf.getPageCount() - 1 === this.currentIndex) && isNext) {
      this.currentIndex++;
      doc = await this.copyPage(this.currentIndex);

    } else if (index) {
      doc = await this.copyPage(index);

    }
    this.showCurrentPage(doc);
    this.updatePageCounter();

    //console.log(this.currentIndex)
  }

  async deletePage() {
    if(this.srcPdf.getPageCount() == 1) {
      let docTemp = await PDFDocument.create();
      this.srcPdf = await PDFDocument.create();
      this.currentIndex = 0;
      this.displayPdfJs(docTemp)
      this.updatePageCounter()
    } else {
      this.srcPdf.removePage(this.currentIndex);
      let temp = await this.srcPdf.saveAsBase64({dataUri: true});
      this.srcPdf = await PDFDocument.load(temp);
      if(this.srcPdf.getPageCount() == 1) {
      /* let docTemp = await PDFDocument.create(); */
      this.currentIndex = 0;
      this.ngOnInit();
      this.updatePageCounter();
    }
    else if (this.srcPdf.getPageCount() === this.currentIndex) {
      this.changePage(null);
      console.log(this.srcPdf.getPageCount())
    }
    else{
      console.log(this.srcPdf.getPages().length)
      this.currentIndex++
      this.changePage(undefined, this.currentIndex);
    }
    }

  }

updatePageCounter() {
    this.numberOfPages = this.srcPdf.getPageCount();
    this.currentPageNumber = this.numberOfPages ? this.currentIndex + 1 : 0;

    console.log(this.currentPageNumber, this.numberOfPages)
  }

  async previewDisplay(doc: PDFDocument) {
    this.canvas2 = this.leftCanvas.nativeElement;
    this.canvas3 = this.middleCanvas.nativeElement;
    this.canvas4 = this.rightCanvas.nativeElement;
    this.ctx2 = this.canvas2.getContext('2d');
    this.ctx3 = this.canvas3.getContext('2d');
    this.ctx4 = this.canvas4.getContext('2d');

    let byteArray = await doc.save();
    //let pdfData = atob(pdf64);

    let loadingTask = pdfjsLib.getDocument({data: byteArray});
    loadingTask.promise.then((pdf) => {

      for (let i = 2; i <= 4; i++) {
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

  async copyToClipboard() {
    let base64 = await this.srcPdf.saveAsBase64();
    let filename = 'pdf.pdf'
    let contentType = 'application/pdf'
    const blobData = this.convertBase64ToBlobData(base64, contentType);

    const blob = new Blob([blobData], { type: contentType });
    const url = window.URL.createObjectURL(blob);
      // window.open(url);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  }

convertBase64ToBlobData(base64Data: string, contentType: string='image/png', sliceSize=512) {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

}

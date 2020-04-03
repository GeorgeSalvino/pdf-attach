import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { PDFDocument, PDFEmbeddedPage, PDFPage } from 'pdf-lib';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-current-page',
  templateUrl: './current-page.component.html',
  styleUrls: ['./current-page.component.css']
})
export class CurrentPageComponent implements OnInit {


  fileForm = new FormGroup({
    fileUpload: new FormControl(''),
  });

  pdf64 = this.sanitizer.bypassSecurityTrustUrl('');

  @ViewChild('fileInput') fileInput: ElementRef;

  currentIndex = 0;

  srcPdf: PDFDocument;

  currentPageNumber = 0;
  numberOfPages = 0;

  constructor(private sanitizer: DomSanitizer) {

  }

  async ngOnInit(): Promise<void> {
    this.srcPdf = await PDFDocument.create();

    console.log(this.srcPdf);
  }

  async loadFile() {
    let reader = new FileReader();
    reader.readAsDataURL(this.fileInput.nativeElement.files[0]);
    reader.onload = async () => {

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
      this.updatePageCounter();
    };

  }

  async copyPage(indexToCopy) {
    let doc = await PDFDocument.create();

    const copiedPage = await doc.copyPages(this.srcPdf, [indexToCopy]);
    doc.insertPage(0, copiedPage[0]);
    return doc;
  }

  async showCurrentPage(doc) {
    const onePagePdfBytes = await doc.saveAsBase64({dataUri: true});
    this.pdf64 = this.sanitizer.bypassSecurityTrustResourceUrl(onePagePdfBytes);
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

      this.changePage(undefined, this.currentIndex);
    }
  }

  updatePageCounter() {
    this.currentPageNumber = this.currentIndex + 1;
    this.numberOfPages = this.srcPdf.getPageCount();
  }


}

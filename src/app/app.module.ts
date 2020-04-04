import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CurrentPageComponent } from './current-page/current-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PreviewComponent } from './preview/preview.component';
import { SafePipe } from './safe.pipe';

@NgModule({
  declarations: [
    AppComponent,
    CurrentPageComponent,
    PreviewComponent,
    SafePipe
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ModalAddPage } from './modal-add';
import {ComponentsModule} from "../../components/components.module";

@NgModule({
  declarations: [
    ModalAddPage
  ],
  imports: [
    IonicPageModule.forChild(ModalAddPage),
    ComponentsModule
  ],
})
export class ModalAddPageModule {}

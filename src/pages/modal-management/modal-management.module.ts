import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ModalManagementPage } from './modal-management';
import {ComponentsModule} from "../../components/components.module";

@NgModule({
  declarations: [
    ModalManagementPage
  ],
  imports: [
    IonicPageModule.forChild(ModalManagementPage),
    ComponentsModule
  ],
})
export class ModalManagementPageModule {}

import {Component} from '@angular/core';
import {ActionSheet, IonicPage, NavController, NavParams} from 'ionic-angular';
import {App, AppStatus} from "../../components/appicon-widget/app";
import {DomSanitizer} from "@angular/platform-browser";
import {HttpDataProvider} from "../../providers/http-data/http-data";
import {Subscription} from "rxjs/Subscription";
import {SharedLocalStorageProvider} from "../../providers/localstorageservice/sharedlocalstorage";
import {LocalStorage} from "ngx-store";


/**
 * Generated class for the ModalAddPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-modal-add',
  templateUrl: 'modal-add.html',
})
export class ModalAddPage {
  apps: Array<App>; //all apps that are downloaded from registry
  chosenApps: Array<App>;  //chosen by user apps, which will appear on the map after pressing "Done" button
  appClicked: Array<boolean>;
  ifShow: boolean;
  urlRegistry: string;  //registry URL, must be provided by user
  previousUrlRegistry: string;
  registrySubscription: Subscription;
  errorMessage: Array<string>; //it is an array, so that messages with a HTTP failure will be shown with the red color word "Error"
                               // in the beginning and other messages just in black color without word "Error"
  ifError: boolean;
  selectedFile: File;

  @LocalStorage()
  selectedImg: any;

  isScrollingEnabled: boolean;

  reader: FileReader;
  // @ts-ignore
  sensor: { name: string; length: string; description: string; avatar: string; category: number };

  ngOnInit() {
    this.sensor={name:'sensor1', length:"12", category:0, description:'xxxxxdescription',avatar:"https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1569509100531&di=8844189d71048362718047bc0a0e8914&imgtype=0&src=http%3A%2F%2Fphotocdn.sohu.com%2F20151005%2Fmp34314268_1444009929244_3.jpg"};
  }
  //the constructor is executed only once, i.e. after the app starts
  constructor(public sanitizer: DomSanitizer,
              private dataProvider: HttpDataProvider,
              public navCtrl: NavController,
              private sharedLocalStorageProvider: SharedLocalStorageProvider,
              public navParams: NavParams) {
    this.ifShow = false;
    this.ifError = false;
    this.errorMessage = new Array(2);
    if (this.chosenApps != null) {
      for (let i = 0; i < this.chosenApps.length; i++) {
        console.log(this.chosenApps[i].name);
      }
    }
    this.chosenApps = [];
    this.previousUrlRegistry = "";

    this.urlRegistry = this.sharedLocalStorageProvider.getRegistryUrl();
    this.sharedLocalStorageProvider.getRegistryUrlControl().subscribe(newUrl => {
      this.urlRegistry = newUrl;
      console.log("process event of changed url in localstorage");
    });
    this.reader = new FileReader();
    this.selectedImg = "assets/imgs/grundriss.png"; //set a default map to show until user selects something else

  }

  // this method is executed after each loading of this page
  ionViewDidLoad() {
    console.log('ionViewDidLoad ModalAddPage');
  }

  show() {
    //if case

    // in case url should be changed but old apps are saved and there is still subscription to old url
    if (this.previousUrlRegistry != this.urlRegistry && this.registrySubscription != undefined) {
      this.registrySubscription.unsubscribe();
      this.apps = [];
    }
    if (this.urlRegistry != "") {
      this.sharedLocalStorageProvider.setRegistryUrl(this.urlRegistry);
      console.log("set new url regitstry in local storage " + this.urlRegistry);
      this.getData();
    }

    this.previousUrlRegistry = this.urlRegistry;
  }

  addApp(i: number) {
    this.appClicked[i] = !this.appClicked[i];
  }

  submit() {
    if (this.appClicked != undefined) {
      for (let i = 0; i < this.appClicked.length; i++) {
        if (this.appClicked[i]) {
          console.log("show " + i + "-th app on the map");
          this.sharedLocalStorageProvider.setChosenAppsByIndex(i, this.apps[i]);
        }
      }
      this.sharedLocalStorageProvider.setChosenApps();
    }
    this.navCtrl.pop();
  }

  getData() {
    this.dataProvider.baseUrl = this.urlRegistry + "/v2/keys/apps?recursive=true";
    let dataObserver = this.dataProvider.getData();
    this.registrySubscription = dataObserver.subscribe(httpResponse => {
      console.log("Data received:" + httpResponse);

      this.apps = [];

      let apps_data_JSON = httpResponse["node"]["nodes"].map(x => ({
        key: x["key"].split("/")[2],
        nodes: x["nodes"]
          .filter(x => x["value"] != "")
          .map(x => ({key: x["key"].split("/")[3], value: x["value"]}))
      }));


      apps_data_JSON.forEach(app_data => {
        let newApp: App = new App();

        // use a map and make it nicer
        let title = app_data["nodes"].filter(x => x["key"] === "title");
        let iconUrl = app_data["nodes"].filter(x => x["key"] === "iconUrl");
        let userUrl = app_data["nodes"].filter(x => x["key"] === "userUrl");
        let name = app_data["nodes"].filter(x => x["key"] === "name");
        // myapp.push(title);
        // map(x => ({key: x["key"], }))
        if (title[0]) newApp.name = title[0]["value"];
        if (name[0]) newApp.iconLocalHelper = name[0]["value"];
        if (iconUrl[0]) newApp.imgUrl = iconUrl[0]["value"];
        if (userUrl[0]) {
          console.log("Test added url is " + userUrl[0]["value"]);
          newApp.url = userUrl[0]["value"];
        }

        newApp.status = AppStatus.Up;  //TODO: check whether the app is available (online)
        newApp.updateMissingRemoteIcons();

        this.apps.push(newApp);


      });

      if (this.apps.length != 0) {
        this.ifError = false;
        this.ifShow = true;
      } else {
        this.ifShow = false;
        this.ifError = true;
        this.errorMessage[0] = "";
        this.errorMessage[1] = "There are no apps in registry."
      }

      this.appClicked = new Array(this.apps.length);
      for (let i = 0; i < this.apps.length; i++) {
        this.appClicked[i] = false;
      }
    }, err => {
      this.ifError = true;
      this.ifShow = false;
      this.errorMessage[0] = "Error:";
      this.errorMessage[1] = "  no data could be retrieved.";
      console.error('Error :', err.message);
    });
  }

  /**
   * changes a map to be viewed, is invoked when user selects a new map using "select map" button.
   * @param event denotes an event to react, invoked by a user, who selects a new map, clicking "select map" button.
   */
  onFileChanged(event) {
    this.selectedFile = event.target.files[0];
    this.reader.onload = (e: any) => {
      this.selectedImg = e.target.result;
    };

    console.log(this.selectedImg);
    this.reader.readAsDataURL(event.target.files[0]);
  }

  closeModal() {
    this.navCtrl.pop();

  }

  chooseImg(){

  }
  //mobile
/*  chooseImg() {
    let actionSheet = ActionSheet.actionSheet({
      buttons: [
        {
          text: '选取图片',
          handler: () => {
            this.checkImg();
          }
        }, {
          text: '拍照',
          handler: () => {
            this.takePhoto();
          }
        }, {
          text: '取消',
          role: 'cancel'
        }
      ]
    });
    this.navController.present(actionSheet);

  }



  //
  checkImg() {
    let options = {maximumImagesCount: 1};
    ImagePicker.getPictures(options).then((results) => {
      for (var i = 0; i < results.length; i++) {
        this.user.personImg = results[i];
      }
    });
  }

  takePhoto() {
    let options = {
      //这些参数可能要配合着使用，比如选择了sourcetype是0，destinationtype要相应的设置
      quality: 100,                                            //相片质量0-100
      destinationType: Camera.DestinationType.FILE_URI,        //返回类型：DATA_URL= 0，返回作为 base64 編碼字串。 FILE_URI=1，返回影像档的 URI。NATIVE_URI=2，返回图像本机URI (例如，資產庫)
      sourceType: Camera.PictureSourceType.CAMERA,             //从哪里选择图片：PHOTOLIBRARY=0，相机拍照=1，SAVEDPHOTOALBUM=2。0和1其实都是本地图库
      allowEdit: false,                                        //在选择之前允许修改截图
      encodingType: Camera.EncodingType.JPEG,                   //保存的图片格式： JPEG = 0, PNG = 1
      targetWidth: 200,                                        //照片宽度
      targetHeight: 200,                                       //照片高度
      mediaType: 0,                                             //可选媒体类型：圖片=0，只允许选择图片將返回指定DestinationType的参数。 視頻格式=1，允许选择视频，最终返回 FILE_URI。ALLMEDIA= 2，允许所有媒体类型的选择。
      cameraDirection: 0,                                       //枪后摄像头类型：Back= 0,Front-facing = 1
      saveToPhotoAlbum: true                                   //保存进手机相册
    };
    Camera.getPicture(options).then((imageData) => {
      this.user.personImg = "data:image/jpeg;base64," + imageData;
    }, (err) => {
      console.log(err);
    });
  }*/
}

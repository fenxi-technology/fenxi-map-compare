import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {App, AppStatus} from "../../components/appicon-widget/app";
import {DomSanitizer} from "@angular/platform-browser";
import {HttpDataProvider} from "../../providers/http-data/http-data";
import {Subscription} from "rxjs/Subscription";
import {SharedLocalStorageProvider} from "../../providers/localstorageservice/sharedlocalstorage";
import {debug} from "ngx-store/src/config";

/**
 * Generated class for the ModalCatalogPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-modal-catalog',
  templateUrl: 'modal-catalog.html',
})
export class ModalCatalogPage {
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
  appData: any = [
    {id:0, name: "Wire Sensor", url: "https://sensor-manager.jit-systems.de/inspectorp65x", category:0, categoryText:"Metal A",  status: 1, imgUrl: "https://sensor-manager.jit-systems.de/images/inspectorp65x.png", previewPosition: "left", description:"xxxxxdescription"},
    {id:1, name: "Air Quality Sensor", url: "https://sensor-manager.jit-systems.de/sb30", category:0,categoryText:"Metal A",status: 1, imgUrl: "https://sensor-manager.jit-systems.de/images/sb30.png", previewPosition: "left", description:"xxxxxdescription"},
    {id:2, name: "Diameter Sensor", url: "https://sensor-manager.jit-systems.de/diameter", category:0,categoryText:"Metal A",status: 1, imgUrl: "https://sensor-manager.jit-systems.de/images/inspectorp65x.png", previewPosition: "left", description:"xxxxxdescription"},
    {id:3, name: "Safety Area Sensor", url: "https://sensor-manager.jit-systems.de/s3000", category:1,categoryText:"Metal B",status: 1, imgUrl: "https://sensor-manager.jit-systems.de/images/s3000.png", previewPosition: "left", description:"xxxxxdescription"},
    {id:4, name: "Safety Barrier Sensor", url: "https://sensor-manager.jit-systems.de/c4000advanced",category:1 ,categoryText:"Metal B",status: 1, imgUrl: "https://sensor-manager.jit-systems.de/images/c4000advanced.png", previewPosition: "left", description:"xxxxxdescription"},
    {id:5, name: "TBS Temperature", url: "https://sensor-manager.jit-systems.de/TBS-1DSGT1006NE", category:1,categoryText:"Metal B",status: 1, imgUrl: "https://sensor-manager.jit-systems.de/images/TBS-1DSGT1006NE.png", previewPosition: "left", description:"xxxxxdescription"},
    {id:6, name: "W150 Proximity", url: "https://sensor-manager.jit-systems.de/w150", status: 1,category:2,categoryText:"Metal C", imgUrl: "https://sensor-manager.jit-systems.de/images/w150.png", previewPosition: "left", description:"xxxxxdescription"},
    {id:7, name: "Safety Barrier Sensor", url: "https://sensor-manager.jit-systems.de/c4000advanced", category:2,categoryText:"Metal C",status: 1, imgUrl: "https://sensor-manager.jit-systems.de/images/c4000advanced.png", previewPosition: "left", description:"xxxxxdescription"},

  ];
  data=this.appData;
  categorys: any=[{label:"Metal A",checked:false,value:0}, {label:"Metal B",checked:false,value:1}, {label:"Metal C",checked:false,value: 2}];
  kinds: Array<number>;

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

    this.urlRegistry = "https://sensor-registry.jit-systems.de";// this.sharedLocalStorageProvider.getRegistryUrl();
    this.sharedLocalStorageProvider.getRegistryUrlControl().subscribe(newUrl => {
      this.urlRegistry = newUrl;
      console.log("process event of changed url in localstorage");
    });
    this.appClicked = new Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      this.appClicked[i] = false;
    }
    this.getAllItems();
    this.kinds=[];
  }

  // this method is executed after each loading of this page
  ionViewDidLoad() {
    console.log('ionViewDidLoad ModalCatalogPage');
    this.apps = this.sharedLocalStorageProvider.objToArrayOfApps(this.data);
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
          //拼app


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

  onHold($event: Event, id) {
    this.appClicked[id] = !this.appClicked[id];

  }

  //pan
  onSlide(id: number | string | ArrayBuffer | any) {
    alert(id);
  }

  delSensor(id) {
    for (var i = 0; i < this.data.length; i++) {
      if (id === this.data[i].id) {
        this.data.splice(i, 1);
      }
    }
  }

  getAllItems(){
    return this.appData;

  }
  getItems(event) {
    this.data= this.getAllItems();
    var val = event.target.value;
    if (val && val.trim() != '') {
      this.data = this.data.filter((item) => {
        return (item.name.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
    }
  }

  getItemsByCategory(event,category) {
    this.data= this.getAllItems();
    console.log("getItemsByCategory-----success");
    if(category.checked){
      if(! (this.kinds.indexOf(category.value)>-1))
        this.kinds.push(category.value);
    }else{
      this.kinds = this.kinds.filter((item) => {
        return (item !=category.value);
      })
    }
    if(this.kinds.length>0){
      this.data = this.data.filter((item) => {
        return (this.kinds.indexOf(item.category)>-1);
      })
    }
  }
}

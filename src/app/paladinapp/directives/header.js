angular
.module('paladinApp')
.component('header', {
  bindings: {
      user:'=',
  },
  controller: class HeaderComponent {

    constructor($base64, $scope,$rootScope,$translate, $mdDialog, $http, $cookies, $timeout,popupService,enums) {
      this.base64 = $base64;
      this.scope =$scope;
      this.rootScope = $rootScope;
      this.translate = $translate;
      this.baseUrl = window.globals.API_URL;
      this.supportedLanguages = window.globals.SUPPORTED_LANGS;
      this.profileImageBaseUrl = window.globals.PROFILE_IMAGE_URL;
      this.mdDialog = $mdDialog;
      this.http = $http;
      this.btnStatus = 10;
      this.signupMessage = "";
      this.signupStatus = "";
      this.signupFacebookStatus = "";
      this.signupacebookMessage = "";
      this.loginFacebookStatus = "";
      this.loginFacebookMessage = "";
      this.loginStatus = "";
      this.loginMessage = "";
      this.cookies = $cookies;
      this.userStatus = false;
      this.timeout = $timeout;
      this.popupService = popupService;
      this.enums = enums;
      this.user = null;
      this.registerBusEvents();
    };
    

    registerBusEvents() {
        let deregs = [];

        deregs.push(this.rootScope.$on(this.enums.busEvents.updatedUser,(event,data) => {
            this.user = data;
            this.userStatus = this.user != null;
        }));

        this.scope.$on('$destroy', function() {
            while (deregs.length)
                deregs.pop()();
        });
    }

    $onInit() {

      this.profileDefaultImage="../../assets/profile.png"; 
      var _this = this;
      this.currentLang =this.translate.proposedLanguage()?this.translate.proposedLanguage(): this.translate.preferredLanguage();
      this.currentLang  = this.rootScope.lang;
      this.translate.use(this.rootScope.lang);
      
      this.scope.$on('updateLanguage', function(event,data){
        _this.changeLanguage(data,false)
      })
      
      if(this.cookies.getObject('globals') != undefined)
          if (this.cookies.getObject('globals').currentUser != undefined)
              if (this.cookies.getObject('globals').currentUser.username != undefined)
                     this.userStatus = true;     
        
       
      this.rootScope.$on('registeredSuccess', function(event,data){
        _this.userStatus = true;     
      })   
    }

    changeLanguage(lang,broadcastChange){
      this.rootScope.lang = lang.code;
      this.translate.use(lang.code);
      this.currentLang = lang.code;
  
      
      if(broadcastChange) {
          this.rootScope.$broadcast('languageChanged', lang.code);
          this.rootScope.$emit(this.enums.busEvents.preferredLanguageChange,{currentLang: lang.code});
      }

    }

    hide() {
      this.mdDialog.hide();
    };

    cancel() {
      this.mdDialog.cancel();
    };

    answer(answer) {
      this.mdDialog.hide(answer);
    };

    forgotPassword(email){
      this.btnForgotPasswordStatus = 1;
      var dataObj = {
        User_Email : email,
        LanguageCode: this.currentLang == "it" ? "it-IT" : this.currentLang
      };
        
        
        this.http.defaults.headers.common['Authorization'] = 'Basic ' + this.base64.encode('Paladin:Paladin123');
        this.http.defaults.headers.common['Charset'] = 'UTF-8';
        this.http.defaults.headers.common['Content-Type'] = 'application/json';

          this.http.post(this.baseUrl + "ForgetPassword/", JSON.stringify(dataObj)).then((response) => {
                this.btnForgotPasswordStatus = 10;
                this.forgotpasswordStatus = response.data.Status;
                this.forgotPasswordMessage = response.data.Message;
            });

    }
      showTabDialogForgotPassword(ev){

        this.mdDialog.show({
          controller: ()=>this,
        controllerAs: 'ctrl',
          templateUrl: 'tabDialogForgotPassword',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose:true,
        http: this.http
        });
          

      }


  register(username, password, email, location) {
    this.btnStatus = 1;
    var dataObj = {
      User_UserName : username,
      User_Email : email,
      User_Address : location,
      User_Password : password,
      User_UDIDType : 3,
      LanguageCode: this.currentLang == "it" ? "it-IT" : this.currentLang
    };
        this.http.post(this.baseUrl + "SignUp/", dataObj).then((response) => {
           this.btnStatus = 10;
              this.signupStatus = response.data.Status;
              if(response.data.Status == 'error')
                this.signupMessage = response.data.Message;
          });
  }
  registerFacebook() {

    if(this.rootScope.facebookApiLoaded) {

        this.btnStatus = 1;

        var dataObj = {
          User_UserName :this.rootScope.facebook_user.name.replace(" ","-") ,
          User_Email : this.rootScope.facebook_user.email,
          User_Address : this.rootScope.facebook_user.address,
          User_Password : "",
          User_UDIDType : 3,
          LanguageCode: this.currentLang  == "it" ? "it-IT" : this.currentLang,
          User_DisplayPicturePath:'http://graph.facebook.com/' + this.rootScope.facebook_user.id + '/picture?type=small',
          User_DisplayPicture: 'http://graph.facebook.com/' + this.rootScope.facebook_user.id + '/picture?type=small',
          User_FacebookId: this.rootScope.facebook_user.id ,
          User_FullName: this.rootScope.facebook_user.name,
          User_QBId:''
        };


            this.http.post(this.baseUrl + "SignUp/", dataObj).then((response) => {
               this.btnStatus = 10;
                  this.signupFacebookStatus = response.data.Status;
                  if(response.data.Status == 'error'){
                    this.signupFacebookMessage = response.data.Message;
                  }else{
                    this.rootScope.globals = {
                        currentUser: {
                            username: response.data.Data.User_UserName,
                            token_type: response.data.Data.oAuthToken.token_type,
                            access_token: response.data.Data.oAuthToken.access_token,
                            refresh_token:  response.data.Data.oAuthToken.refresh_token,
                            User_Id: response.data.Data.User_Id,
                            User_DisplayPicturePath:'http://graph.facebook.com/' + this.rootScope.facebook_user.id + '/picture?type=small',
                            User_DisplayPicture: 'http://graph.facebook.com/' + this.rootScope.facebook_user.id + '/picture?type=small'
                          }
                        };
                    
                        var cookieExp = new Date();
                        cookieExp.setDate(cookieExp.getDate() + response.data.Data.oAuthToken.expires_in);
                        this.cookies.putObject('globals', this.rootScope.globals, { expires: cookieExp });
                        
                        this.http.defaults.headers.common['Authorization'] = this.cookies.getObject('globals').currentUser.token_type + ' ' + this.cookies.getObject('globals').currentUser.access_token;
                        this.hide();
                        this.userStatus = true;
                  }

              });
        }else{
            this.signupFacebookStatus = 'error';
            this.signupFacebookMessage =  this.translate.instant('FACEBOOK_LOADING');
            var _this = this;
            this.timeout( function(){
              _this.registerFacebook();
            }, 2000 );
        }

  }
  logout(){
      this.userStatus = false;
      this.cookies.remove("globals");
      this.http.defaults.headers.common['Authorization'] = '';
  };

  login(username, password) {
    this.btnStatus = 1;
    var dataObj = {
      User_UserName : username,
      User_Email : "",
      User_Mobile: "",
      User_Password : password,
      User_FacebookId: "",
      LanguageCode: this.currentLang == "it" ? "it-IT" : this.currentLang
    };


    this.http.post(this.baseUrl + "Login/", dataObj).then((response) => {
       this.btnStatus = 10;

      if(response.data.Status != 'error'){
          this.loginStatus = response.data.Status;
          console.log(response.data.Data);
          this.rootScope.globals = {
            currentUser: {
                username: response.data.Data.User_UserName,
                token_type: response.data.Data.oAuthToken.token_type,
                access_token: response.data.Data.oAuthToken.access_token,
                refresh_token:  response.data.Data.oAuthToken.refresh_token,
                User_Id: response.data.Data.User_Id,
                User_DisplayPicturePath : response.data.Data.User_DisplayPicturePath
              }
            };
        
            var cookieExp = new Date();
            cookieExp.setDate(cookieExp.getDate() + response.data.Data.oAuthToken.expires_in);
            this.cookies.putObject('globals', this.rootScope.globals, { expires: cookieExp });
            
            this.http.defaults.headers.common['Authorization'] = this.cookies.getObject('globals').currentUser.token_type + ' ' + this.cookies.getObject('globals').currentUser.access_token;
            
            this.http.get(this.baseUrl + "GetUserProfile?User_Id=" + this.cookies.getObject('globals').currentUser.User_Id + "&LanguageCode=" + this.currentLang).then((response) => {
                console.log(response);
                this.hide();
                this.userStatus = true;
              });
    
          }else{
            console.log(JSON.stringify(response, null, 4));
            this.loginStatus = response.data.Status;
            this.loginMessage = response.data.Message;
          }


      });
  };

  showTabDialog(ev) {
      this.popupService.showLoginSignupPopup();
  }
  },
  templateUrl: './views/templates/header.tpl.html'
})

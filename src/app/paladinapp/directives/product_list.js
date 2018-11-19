angular
    .module('paladinApp')
.component('productlist', {
  bindings: {
      filter:'=',
      pages:'<',
      totalPages:'<',
      productsList:'=?',
      count: '<',
      isLoading: '=?'
  },
  controller: class FilterComponent {

    constructor($scope,$rootScope,$location,Products,ngMeta,pager,$anchorScroll,$translate,enums,ptUtils) {
        this.rootScope = $rootScope;
        this.scope = $scope;
        this.Products=Products;
        this.profileImageBaseUrl = window.globals.PROFILE_IMAGE_URL;
        this.productImageBaseUrl = window.globals.PRODUCT_IMAGE_URL;
        this.ngMeta=ngMeta;
        this.pager=pager;
        this.anchorScroll=$anchorScroll;
        this.translate = $translate;
        this.location = $location;
        this.enums = enums;
        this.ptUtils = ptUtils;
    }
    $onInit() {
      //this.products=[];
      this.count=0;
      this.totalPages=0;
      this.productsList = null;
      this.isLoading = false;
  //    this.refreshPageList();      
      this.anchorScroll.yOffset = 0;
      this.profileDefaultImage="../../assets/profile.png";  

      //this.onFilterChange(false);
      var _this = this;
      this.scope.$on('filtersUpdated', function(event){
        _this.onFilterChange(false);
      });

      this.scope.$on('languageChanged', function(event,data){
        
        _this.filter.languageCode = data;
        _this.onFilterChange(false);
      });

      if (this.rootScope.filter) {
        this.onFilterChange(false);  
      }

    }

    updateMetaTags(){
      this.ngMeta.setTitle(this.getPageTitle());
      this.ngMeta.setTag('description',this.getMetaTags());
      this.ngMeta.setTag('imagePath', '../../assets/paladin-logo-300x300.png');
    }

    getPageTitle(){
      if (!this.filter.category.selectedCategoryId) 
      {
        //all categories selected, we put static title
        return this.translate.instant('HOME_TITLE');
      }
      var title = this.translate.instant('RENT')+' ';
      if(this.filter.category && this.filter.category.selectedCategoryName && !this.filter.category.selectedSubCategoryName){
        title += this.filter.category.selectedCategoryName;
      }else if(this.filter.category && this.filter.category.selectedSubCategoryName){
        title += this.filter.category.selectedSubCategoryName;
      }

      var placeName =this.filter.glCity;
      if(placeName){
        title += this.translate.instant('IN')+' '+placeName.split(',')[0]; 
      }

      return title;
    }

    getPricePerDayLabel() {
      return this.translate.instant(window.innerWidth < 768 ? 'PD' : 'PPD');
    }

   
    getMetaTags(){
      if (this.filter.category.selectedCategoryName == this.enums.allCategories[this.filter.languageCode]) {
        return this.translate.instant("DEFAULT_META_DESC");
      }
      var tag = this.translate.instant("RENT_AND_LEND")+' ';
      if(this.filter.category && this.filter.category.selectedCategoryName){
        tag += this.filter.category.selectedCategoryName;
      }else if(this.filter.category && this.filter.category.selectedSubCategoryName){
        tag += this.filter.category.selectedSubCategoryName;
      }

      var placeName =this.filter.glCity;
      if(placeName){
            tag += this.translate.instant('IN')+' '+placeName.split(',')[0]; 
      }
      tag+=' ' + this.translate.instant("WITH") + ' Paladin!'
      return tag;
    }

    getDistanceLabel(product) {

      return '< ' + Math.ceil(this.getDistanceFromLatLonInKm(product.Product_Latitude, product.Product_Longitude, 
        this.rootScope.filter.search.lat, this.rootScope.filter.search.lng)) + " " + this.translate.instant("KM_FROM_YOU");
      
    }

    getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
      var R = 6371; // Radius of the earth in km
      var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
      var dLon = this.deg2rad(lon2-lon1); 
      var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c; // Distance in km
      return d;
    }
    
    deg2rad(deg) {
      return deg * (Math.PI/180)
    }

   navigateToProduct(product) {
        this.rootScope.$emit(this.enums.busNavigation.productDetailed,{ product });
   }

    getProductDetailUrl(product){
      var url = '/';

      if(product){

        url+= this.filter.languageCode ? this.filter.languageCode : '';
      
        url+= '/product';


        //url+='/'+product.Product_Title.trim().split('-').join('+').split(' ').join('-').split('/').join('^');
        url+='/'+this.Products.encryptProductURL(product.Product_Id);
        url+='-' + product.Product_Id;

        /*
        var placeName = this.filter.glCity;
        this.rootScope.searchedLocation = placeName;
        if(placeName){
          //url+='?searchedLocation='+encodeURIComponent(placeName);
        }

        if(this.filter.search.searchStr){
          this.rootScope.q = this.filter.search.searchStr;
          //url+='&&q='+encodeURIComponent(this.filter.search.searchStr); 
        }

        if(this.filter.category && this.filter.category.selectedCategoryName){
          if(url.indexOf('?')<0)url+='?';

          //console.log('SEL CAT : '+this.filter.category.selectedCategoryName)
          this.rootScope.category = this.filter.category.selectedCategoryName.toString().replace(/-/g, ' ');
          //url += '&&category='+this.filter.category.selectedCategoryName.toString().replace(/\s+/g, '-');
        }
        if(this.filter.category && this.filter.category.selectedSubCategoryName){
          if(url.indexOf('?')<0)url+='?';

          //console.log('SEL SUBCAT : '+this.filter.category.selectedSubCategoryName)
          this.rootScope.subcategory =this.filter.category.selectedSubCategoryName.toString().replace(/-/g, ' ');
         // url += '&&subcategory='+this.filter.category.selectedSubCategoryName.toString().replace(/\s+/g, '-');
        }
      }
      //console.log('before redirect : '+this.filter.category.selectedCategoryName);
      */
      }
      return url;
      //return url;
    }

    goToProductPage(product) {
      this.location.url(getProductDetailUrl(product));
    }
    
    goTo(pageNumber){
      this.filter.currentPage = pageNumber;
      
      this.onFilterChange(true);       
    }
    
    isFirstPage(){
      if(this.filter.currentPage==1)return true;
      return false;
    }

    setPage(page){
         if (page>=1 && page <=this.totalPages) {
           this.filter.currentPage = page;
           this.refreshPageList();
           this.onFilterChange(true);   
         }
    }
    refreshPageList() {
      this.pages = this.pager.GetPager(this.totalPages,this.filter.currentPage,5);
      this.isLoading = false;
      this.ngMeta.setTag("prevUrl", undefined);
      this.ngMeta.setTag("nextUrl", undefined);

      if (this.filter.currentPage > 1) {
        this.ngMeta.setTag("prevUrl", this.location.absUrl().replace('pageIndex=' + this.filter.currentPage,'pageIndex=' + (this.filter.currentPage-1)));
      }
      if (this.filter.currentPage < this.totalPages) {
        this.ngMeta.setTag("nextUrl", this.location.absUrl().replace('pageIndex=' + this.filter.currentPage,'pageIndex=' + (this.filter.currentPage+1)));

      }
      // this.rootScope.$broadcast('hideSpinner');
      
    }

    scrollToAnchor() {

      var oldAnchor = this.location.hash();
      this.location.hash("breadcrumb");
      this.anchorScroll();
      this.location.hash(oldAnchor);
    }

    getProductUrl(product) {
      if (product)
          return this.ptUtils.getProductDetailUrl(product);
      return "#";
    }

    isParentCategorySelected() {
      return this.filter.category.selectedCategoryId && this.filter.category.selectedSubCategoryId == null;
    }

    onFilterChange(scrollTop){   
      
      if (this.rootScope.filter && !this.isParentCategorySelected() && window.innerWidth < 768 || scrollTop) {
        this.scrollToAnchor();
      }           
      // this.rootScope.$broadcast('showSpinner');
      this.isLoading = true;
        this.productsList = [];
      this.updateMetaTags();


      this.scope.$evalAsync(() => {
          this.productsList = [];
          Promise.all([
              this.Products.getAll(this.filter),
              this.Products.getTotalPageCount(this.filter)
          ])
              .then((results) => {
                  this.scope.$evalAsync(() => {
                      this.isLoading = false;
                      this.productsList = results[0].data.Data[0];
                      this.totalPages = results[1].data.Data;
                      this.refreshPageList()
                  })
              })
              .catch((err) => {
                  this.scope.$evalAsync(() => {
                      this.isLoading = false;
                      this.productsList = [];
                      this.totalPages = 0;
                  })
              });
      });

    }

    increment() {
      this.count++;
    }
    decrement() {
      this.count--;
    }
    
  },
  templateUrl:'./views/templates/product_list.tpl.html'
})

;
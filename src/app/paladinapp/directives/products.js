angular
.module('paladinApp')
.component('products', {
  bindings: {
    filter:'=',
    count: '<',
    loading:'<'
  },
  controller:class ProductController {

    constructor($scope,$sce,Filters,$rootScope,enums,ngMeta,$translate,$window,$location){
      this.scope =$scope;
      this.sce = $sce;
      this.Filters = Filters;
      this.rootScope= $rootScope;
      this.ngMeta=ngMeta;
      this.loading=true;
      this.translate = $translate;
      this.window = $window ;
      this.location =$location;
      this.enums = enums;
    }

    $onInit() {
      this.count=0;    
      this.loading=true; 
      var _this = this;
      

      this.scope.$on('showSpinner', function(event){
        
        _this.loading = true;
      });

      this.scope.$on('hideSpinner', function(event){
        
        _this.loading = false;
      });

      
    }

    getCurrentCategory(){
      
      
      return this.translate.instant('ACTG');
    }

    isNotAllCategory(){
      return this.filter.category.defaultCategoryName!=this.filter.category.selectedCategoryName 
            && this.filter.category.selectedCategoryName != this.getCurrentCategory();
    }

    refreshProducts(){      
      //console.log("REFRESH PRODUCTS in products.js");  
      this.rootScope.$broadcast('filtersUpdated',this.filter);       
    }    

    sortBy(sort,code){
      this.filter.sortBy = sort;
      this.filter.sortByCode = code;
      this.filter.currentPage = 1;
      this.refreshProducts();
    }

    getBannerImageUrl(){
      return (this.isNotAllCategory() ? window.globals.CATEGORY_IMAGE_URL : '')
        + (this.filter.category.selectedSubCategoryBannerImage ? this.filter.category.selectedSubCategoryBannerImage : this.filter.category.selectedCategoryBannerImage);
    }

    getCategoryDescription(){
      if (!this.filter.category.selectedCategoryId) {
        //all categories selected
        var desc = this.translate.instant('ALL_CATEGORIES_DESC');
        if (desc.length>0) {
          return this.sce.trustAsHtml(desc);
        } else {
          return null;
        }
      } else if (this.filter.category.selectedSubCategoryId != null) {
        //sub category selected
        return this.filter.category.selectedSubCategoryDesc;
      } else {
        return this.filter.category.selectedCategoryDesc;
      }  
    }

    switchCategoryToAll(category){      
      this.filter.category.selectedCategoryId = null;
      this.filter.category.selectedCategoryDesc =this.sce.trustAsHtml(this.translate.instant('ACTG'));
      this.filter.category.selectedCategoryName =this.translate.instant('ACTG');  
      this.filter.category.selectedCategoryImagePath=null;
      this.filter.category.selectedCategoryBannerImage = window.globals.IS_PROMO ? this.enums.categoriesBannersPaths.promo : this.enums.categoriesBannersPaths.all[this.translate.use()];
      this.removeSubCategory();      
      this.refreshProducts();
    }

    getH1(){
      
      var h1 = '';
      var selectedCategoryStr = this.filter.category && this.filter.category.selectedSubCategoryName 
        ? this.filter.category.selectedSubCategoryName
        : this.filter.category.selectedCategoryName;

        
      h1 += this.isNotAllCategory() ? this.translate.instant('FIND_THE_BEST')+' ' : this.translate.instant('RENT') + ' ';
        
      if (this.filter.search.currentSearchStr && this.filter.search.currentSearchStr.length>0) {
        h1 +="\"" + this.filter.search.currentSearchStr + "\"" + " " + this.translate.instant('WITHIN') + " ";
      } 
        h1 += selectedCategoryStr;

      var placeName = this.filter.glCity;
      if(placeName){
         h1 += this.translate.instant('IN')+' '+placeName.split(',')[0]; 
      } 
      //return this.capitalizeFilter(h1);
      return h1;
    }

    getH2(){
      var h2 = this.translate.instant('RENT_AT_BEST_PRICE')+ ' ';

      if(this.filter.category && this.filter.category.selectedCategoryName && !this.filter.category.selectedSubCategoryName){
        h2 += this.filter.category.selectedCategoryName;
      }else if(this.filter.category && this.filter.category.selectedSubCategoryName){
        h2 += this.filter.category.selectedSubCategoryName;
      }

      var placeName =this.filter.glCity;
      if(placeName){
         h2 += this.translate.instant('IN')+' '+placeName.split(',')[0]; 
      } 
      return h2;
    }
    
    getCategoriesUrl(categoryName, subcategoryName) {
      return this.Filters.getCategoriesUrl(categoryName, subcategoryName, this.rootScope.isTryAndBuy, this.translate.use());
    }


    removeSubCategory(){      
      this.filter.category.selectedSubCategoryId = null;
      this.filter.category.selectedSubCategoryDesc =null;  
      this.filter.category.selectedSubCategoryName =null;  
      this.filter.category.selectedSubCategoryImagePath = null;
      this.filter.category.selectedSubCategoryBannerImage = null;
    }

    switchMainCategory(){      
      //here when sub category is implemented make it defaut so only main category will be seen
      this.removeSubCategory();
      this.refreshProducts();
    }
    switchSubCategory(){
      this.refreshProducts();
    }
    /*goBack(){
      console.log('GO BACK CLICKED')
      console.log(this.translate.proposedLanguage())
      //this.location.url('/');
      //this.refreshProducts();
    }*/

  },
  templateUrl:'./views/templates/products.tpl.html'
})

;
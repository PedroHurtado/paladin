class FilterComponent {

    constructor($scope,$sce,Filters,$rootScope,$translate,$location,enums) {
      this.scope =$scope;
      this.Filters = Filters;
      this.translate = $translate;
      //this.filter = {categories:[],languageCode:'en',selectedCategoryId:null,priceRange:[10,100]};
      this.enums = enums;
      this.rootScope = $rootScope;
      this.categoryImageBaseUrl = window.globals.CATEGORY_IMAGE_URL;
      this.location = $location;
      this.sce = $sce;
      this.slider = {};
      this.showCategoriesDiv = false;
      this.slider.priceSliderOption = {
        options: {
          orientation: 'horizontal',
          min: 0,
          max: 240,
          step: 10,
          range: true
        }
      };
     this.slider.distanceSliderOption = {
        options: {
          orientation: 'horizontal',
          min: 0,
          max: 240,
          step: 10,
          range: false
        }
      };
    }
    
    $onInit() {
      this.scope.priceRange = [0,1000];
      this.count=0;
      this.selectedTab = this.filter.category.isTryAndBuy == true ? 0 : 1 || 0;
      this.customCategoriesTnB = this.getCategories(true); 
      this.customCategoriesP2P = this.getCategories(false);
      
      var _this= this;
      //this.scope.distanceRange = 100;


      this.scope.$watch('priceRange',function(){
        if (_this.filter.priceRange[0] != _this.scope.priceRange[0] ||
          _this.filter.priceRange[1] != _this.scope.priceRange[1]) {
          _this.filter.priceRange = _this.scope.priceRange;
          //console.log("price range changed... to " + _this.scope.priceRange);
          //console.log("old price range is " + _this.filter.priceRange);
          _this.refreshProducts();
        }
      });

      /*this.scope.$watch('distanceRange',function(){
        _this.filter.distanceRange = _this.scope.distanceRange;
        _this.refreshProducts();
      })*/

      /*
      //here we already load the categories in case the page is refreshed, and we select the All Categories by default
      if (!this.rootScope.filter || this.rootScope.forceLoadCategory) {
        this.refreshCategories(null,null, $rootScope.lang);
      }
      */

      
      this.scope.$on('languageChanged', function(event,data){
        _this.filter.languageCode = _this.getCurrentLanguageCode();

        if (_this.filter.category.selectedSubCategoryId != null) {
          //subcategory selected

          _this.refreshCategories(_this.filter.category.selectedCategoryId,
                                  _this.filter.category.selectedSubCategoryId, _this.filter.languageCode);
   
        } else if (_this.filter.category.selectedCategoryId != null) {
          //parent category other than All Categories selected
          _this.refreshCategories(_this.filter.category.selectedCategoryId, null, _this.filter.languageCode);

        } else {
          _this.refreshCategories(null, null, _this.filter.languageCode);
        }

      }); 

    }

    selectCategories(selCategoryId, selSubcategoryId, lang) {
      if (selCategoryId==null) {
        this.selectCategory(this.enums.allCategories[lang], false);
      } else {
        this.selectCategory(this.Filters.getCategoryById(selCategoryId, lang), false);
        if (selSubcategoryId!=null)
          this.selectSubCategory(this.Filters.getSubcategoryById(selSubcategoryId, lang), false);
      }
    }

    refreshCategories(selCategoryId, selSubcategoryId, lang){

      this.filter.categories = this.rootScope.categoriesMap.get(lang);
      this.selectCategories(selCategoryId, selSubcategoryId, lang);
    }

    getCategories(isTryAndBuy) {
      let categories = {};
      let i = 0;
      this.rootScope.categoriesMap.get(this.getCurrentLanguageCode()).forEach((item) => {
        if (isTryAndBuy && item.IsTryAndBuy || !isTryAndBuy && !item.IsTryAndBuy) {
          categories[i++] = item;
        } 
      });

      return categories;
      
    }

    toggleDiv() {
      this.showCategoriesDiv = !this.showCategoriesDiv;
    }
    getCurrentLanguageCode() {
      return this.translate.use();
    }
    selectCategory(category, refreshProductList){
      if(typeof category != 'string'){
        this.filter.category.selectedCategoryId = category.Category_Id;
        this.filter.category.selectedCategoryDesc =this.sce.trustAsHtml(category.Category_Description);  
        this.filter.category.selectedCategoryName =this.sce.trustAsHtml(category.Category_Name);  
        this.filter.category.selectedCategoryImagePath = category.Category_ImagePath;
        this.filter.category.selectedCategoryBannerImage = category.Category_BannerPath;
        this.filter.category.isTryAndBuy = category.IsTryAndBuy;
        this.rootScope.category = this.filter.category.selectedCategoryName;
        
      }else{
        this.filter.category.selectedCategoryId = null;
        this.filter.category.selectedCategoryDesc =this.sce.trustAsHtml(category);
        this.filter.category.selectedCategoryName =category;  
        this.filter.category.selectedCategoryImagePath =null;
        this.filter.category.isTryAndBuy = this.rootScope.isTryAndBuy;
        this.filter.category.selectedCategoryBannerImage = window.globals.IS_PROMO ? this.enums.categoriesBannersPaths.promo : this.enums.categoriesBannersPaths.all[this.getCurrentLanguageCode()];
        this.rootScope.category=category;

      }
      this.selectSubCategory(null,false);

      //console.log('category clicked...')
      
      if (refreshProductList) {
        this.refreshProducts();
      }
    }

    onTabSelected() {
      if (this.selectedTab == 0) {
        this.rootScope.$emit(this.enums.busNavigation.switchBrowseMode, {isTryAndBuy: true});
      } else {
        this.rootScope.$emit(this.enums.busNavigation.switchBrowseMode, {isTryAndBuy: false});
      }
    }

    selectSubCategory(subCategory,refreshProductList){
      if(subCategory){
        //console.log(this.sce.trustAsHtml(subCategory.SubCategory_Name));
        this.filter.category.selectedSubCategoryId = subCategory.SubCategory_Id;
        this.filter.category.selectedSubCategoryDesc =this.sce.trustAsHtml(subCategory.SubCategory_Description);  
        this.filter.category.selectedSubCategoryName =this.sce.trustAsHtml(subCategory.SubCategory_Name);  
        this.filter.category.selectedSubCategoryImagePath = subCategory.SubCategory_ImagePath;
        this.filter.category.selectedSubCategoryBannerImage = subCategory.SubCategory_BannerPath;
        this.rootScope.subcategory=this.filter.category.selectedSubCategoryName;
      }else{
        this.filter.category.selectedSubCategoryId = null;
        this.filter.category.selectedSubCategoryDesc =null;  
        this.filter.category.selectedSubCategoryName =null;  
        this.filter.category.selectedSubCategoryImagePath = null;
        this.filter.category.selectedSubCategoryBannerImage = null;
        this.rootScope.subcategory = null;
      }

      this.filter.search.searchStr = '';
      this.filter.search.currentSearchStr='';
      this.rootScope.searchKey = null;
      this.location.search('search',null);
      
      if (this.rootScope.searchKey != null) {
        this.rootScope.searchKey = null;
      }

      this.filter.currentPage =1;

      //console.log('sub category clicked...')
      if(refreshProductList)this.refreshProducts();
    }

    getCategoryUrl(category, subcategory, isTryAndBuy) {
      return this.Filters.getCategoriesUrl(category==0 ? this.translate.instant('ACTG') : category.Category_Name, 
            subcategory == null ? null : subcategory.SubCategory_Name, isTryAndBuy, this.translate.use());
    }
    
    refreshProducts(){
        //console.log("REFRESH PRODUCTS in filters.js");
        this.rootScope.$broadcast('filtersUpdated',this.filter);
    }    

    increment() {
      this.count++;
    }

    decrement() {
      this.count--;
    }
    
};

angular
.module('paladinApp')
.component('filters', {
  bindings: {
    categories : '<',
    filter :'=',
    count: '='
  },
  controller: FilterComponent,
  templateUrl: './views/templates/filter.tpl.html'
})

;
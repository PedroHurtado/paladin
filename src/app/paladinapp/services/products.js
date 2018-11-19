angular.module('paladinApp')
    .factory('Products', ['$http','$base64','enums', function ($http,$base64,enums) {
  var Products = {};

  Products.getHeaders = function(){
    var headers = {
        //"Authorization": "Basic " + auth,
        'Access-Control-Allow-Origin': '*',
        'X-Requested' : null,
        'Content-Type' : 'application/json; charset=utf-8'
    };

    return headers;
  }

  Products.getAll = function(filters) {
    
    if(!filters.languageCode)filters.languageCode='it-IT';

    var payload = {
        //headers: this.getHeaders()
    };

    //console.log("-----GET SEARCHED PRODUCTS: ");
    //console.log(this.searchProductParam(filters));
   return $http.get( window.globals.API_URL  + 'GetBrowsePageProducts?'+this.searchProductParam(filters))
  };

  Products.getTotalPageCount = function(filters) {
    
    if(!filters.languageCode)filters.languageCode='en';

    var payload = {
        headers: this.getHeaders()
    };
    //console.log("-----GET PAGE COUNT----");
    //console.log(window.globals.API_URL  + 'GetPageCount?'+this.searchProductParam(filters));

    return $http.get( window.globals.API_URL  + 'GetPageCount?'+this.searchProductParam(filters))
  };

  /*
  Products.decryptProductURL = function(url) {
    return url.split('-').join(' ').split('_').join('-').split('^').join('/').split('__').join('_');
  }
  */

  Products.encryptProductURL = function(productName) {
    return productName.trim().split(' ').join('-').split('/').join('-');
  }

  Products.getDetail = function(productId,languageCode,callback) {
    var payload = {
        headers: this.getHeaders()
    };

    if(!languageCode)LanguageCode='en';

    //console.log("-----GET PRODUCT DETAIL API----");
    //console.log(window.globals.API_URL  + 'GetProductDetail?User_Id=0&Product_Title='
    //+encodeURIComponent(Products.decryptProductURL(productId)));

    

    if(!isNaN(productId)){
      $http.get(window.globals.API_URL  + 'GetProductDetail?User_Id=0&Product_Id='+productId).then(callback);
    }else{
      $http.get(window.globals.API_URL  + 'GetProductDetail?User_Id=0&Product_Title='+encodeURIComponent(Products.decryptProductURL(productId))).then(callback);
    }

  };

  Products.formatLanguageCode = function(code){
    return code=='it'?'it-IT':code;
  };

  Products.searchProductParam = function(json){
    var _this = this;
    var keys = Object.keys(json);
    var paramStr = '';
    for(var i=0;i<keys.length;i++){
      var k = keys[i];
      var val = json[k] ;
      if(k == 'languageCode' && val){
        paramStr+= 'LanguageCode' + '=' + encodeURIComponent(this.formatLanguageCode(val)); 
      }else if(k == 'category' && val){
        if(val.selectedCategoryId){
          paramStr+= 'Category_Id' + '=' + encodeURIComponent(val.selectedCategoryId); 
        }
        if(val.selectedSubCategoryId){
          paramStr+= '&SubCategory_Id' + '=' + encodeURIComponent(val.selectedSubCategoryId); 
        }
        if(val.isTryAndBuy != undefined){
          paramStr+=paramStr[paramStr.length-1] == '&' ? 
            'isTryAndBuy=' + encodeURIComponent(val.isTryAndBuy) :
            '&isTryAndBuy=' + encodeURIComponent(val.isTryAndBuy);
        }
      }else if(k == 'sortBy' && val){
        
        if(val=='SortByPopularity'){
          paramStr+='SortByPopularity' + '=true' ; 
        }else if(val=='SortByRecent'){
          paramStr+='SortByRecent' + '=true' ; 
        }else if(val=='SortByGeoLocation'){
          paramStr+='SortByGeoLocation' + '=true' ; 
        }else if(val=='SortByLowPrice'){
          paramStr+='SortByLowPrice' + '=true' ; 
        }else if(val=='SortByHighPrice'){
          paramStr+='SortByHighPrice' + '=true' ; 
        }else if(val=='SortByBestProduct'){
          paramStr+='SortByBestProduct' + '=true' ; 
        }

      }else if(k == 'priceRange' && val){
        var minPrice = val[0];
        var maxPrice = val[1];
        paramStr+= 'MinPriceRange' + '=' + encodeURIComponent(minPrice)+'&'+'MaxPriceRange'+'='+encodeURIComponent(maxPrice); 
      }else if(k == 'currentPage' && val){
        paramStr+= 'PageIndex' + '=' + encodeURIComponent(val-1); 
      }else if(k == 'search' && val){

        var finalStr = ''; 
        if(val.searchStr){
          finalStr+='KeywordProduct' + '=' + encodeURIComponent(val.searchStr); 
          if(val.lat)finalStr+='&';
        }
        
        //we only need to send lat long for sort = nearest
        if(val.lat && json.sortByCode == enums.productsSortByTextCode.SortByGeoLocation){
          finalStr+='Latitude' + '=' +encodeURIComponent(val.lat); 
          if(val.lng)finalStr+='&';
        }
        if(val.lng && json.sortByCode == enums.productsSortByTextCode.SortByGeoLocation){
          finalStr+='Longitude' + '=' +encodeURIComponent(val.lng); 
        }
        paramStr+= finalStr;
      }else if(k == 'distanceRange' && val && json.sortByCode == enums.productsSortByTextCode.SortByGeoLocation){
        var maxDistance = val;
        if(maxDistance<=50)paramStr+= 'Range' + '=' + encodeURIComponent(maxDistance); 
      }else if(k == 'currentPage' && val){
        paramStr+='PageIndex='+(val-1);    
      }

      if(i<(keys.length-1) && paramStr && paramStr.slice(-1) !='&'){

        paramStr+='&';
      }
      
    }

    
    if(paramStr.endsWith('&')){
      paramStr = paramStr.substring(0,paramStr.length-1)
    }
    
    paramStr+='&isWeb=true';
    return paramStr;
  };

  
  return Products;
}]);
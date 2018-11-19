angular.module('paladinApp')
    .factory('Filters', ['$http','$base64','$rootScope','$q',
  function ($http,$base64,$rootScope,$q) {

  var Filters = {};

  Filters.getHeaders = function(){
    var headers = {
        //"Authorization": "Basic " + auth,
        'Access-Control-Allow-Origin': '*',
        'X-Requested' : null,
        'Content-Type' : 'application/json; charset=utf-8'
    };

    return headers;
  };

  Filters.get = function(languageCode,callback) {
    
    if ($rootScope.categoriesMap && $rootScope.categoriesMap.get(languageCode)) {
      return;
    }

    var payload = {
       // headers: this.getHeaders()
    };

    $http.get( window.globals.API_URL + 'GetCategories?LanguageCode='+this.formatLanguageCode(languageCode)).then(callback);
   
  };



  Filters.getCategoryById = function(id, lang) {
    if ($rootScope.categoriesMap && $rootScope.categoriesMap.get(lang)) {
      var categories = $rootScope.categoriesMap.get(lang);
      for (var i=0;i<categories.length;i++) {
        if (categories[i].Category_Id == id) {
          return categories[i];
        }
      }
    } 
    //console.error("Filters.getCategoryById: "+ id + ","+lang+" $rootScope.categoriesMap not defined or null")
  }
  


  Filters.getSubcategoryById = function(id, lang) {
  
    if ($rootScope.categoriesMap && $rootScope.categoriesMap.get(lang)) {
      var categories = $rootScope.categoriesMap.get(lang);
      for (var i=0;i<categories.length;i++) {
        for (var j=0; j<categories[i].Category_SubCatrgories.length; j++) {
          if (categories[i].Category_SubCatrgories[j].SubCategory_Id == id) {
            return categories[i].Category_SubCatrgories[j];
          }
        }
      }
    } 
    //console.error("Filters.getSubcategoryById: "+ id + ","+lang+" $rootScope.categoriesMap not defined or null")    
  };

  Filters.getCategoryByName = function(name, lang, isTryAndBuy) {
    if ($rootScope.categoriesMap && $rootScope.categoriesMap.get(lang)) {
      var categories = $rootScope.categoriesMap.get(lang);
      for (var i=0;i<categories.length;i++) {
        if (isTryAndBuy == categories[i].IsTryAndBuy && categories[i].Category_Name && (categories[i].Category_Name.toLowerCase().replace(/ /g,'-') == name.toLowerCase())) {
          return categories[i];
        }
      }
    } 
    //console.error("Filters.getCategoryByName: "+ name + ","+lang+" $rootScope.categoriesMap not defined or null");
  }

  Filters.getSubcategoryByName = function(name, lang) {
    
      if ($rootScope.categoriesMap && $rootScope.categoriesMap.get(lang)) {
        var categories = $rootScope.categoriesMap.get(lang);
        for (var i=0;i<categories.length;i++) {
          for (var j=0; j<categories[i].Category_SubCatrgories.length; j++) {
            if (categories[i].Category_SubCatrgories[j].SubCategory_Name &&
              categories[i].Category_SubCatrgories[j].SubCategory_Name.toLowerCase().replace(/ /g,'-') == name.toLowerCase()) {
              return categories[i].Category_SubCatrgories[j];
            }
          }
        }
      } 
      //console.error("Filters.getSubcategoryByName: "+ name + ","+lang+" $rootScope.categoriesMap not defined or null");
    }


  Filters.findByName = function(name,languageCode,callback){
    var payload = {
        headers: this.getHeaders()
    };

    $http.get(window.globals.API_URL  + 'GetCategories?LanguageCode='+this.formatLanguageCode(languageCode)).then(function(response){
      var categories = response.data.Data;
      for(var i=0;i<categories.length;i++){
        var category = categories[i];
        if(category.Category_Name && (category.Category_Name.toLowerCase().replace(/ /g,'-') == name.toLowerCase()) ){
          callback(category);
          return;
        }
      }
      callback(null);
    });
  }

  Filters.getSuggestions = function(keywords, languageCode) {
    return $http.get(window.globals.API_URL + 'Suggestion?Keyword='+keywords+'&&LanguageCode='+this.formatLanguageCode(languageCode)).then(function(response) {
      return response.data.Data.map(function(item){
          return item.Keyword;
        })
    });
  }


  Filters.getCategoriesUrl = (categoryName, subcategoryName, isTryAndBuy, languageCode) => {
    let path = window.globals.ROOT_PATH + languageCode + "/categorie/" + (isTryAndBuy ? '' : "privato/");
    if (subcategoryName == null) {
      path = path + categoryName;
    } else {
      path = path + categoryName + "/" + subcategoryName + (filter.glCity? "/" + filter.glCity : '');
    }

    return path.split(' ').join('-');;
  }



  Filters.formatLanguageCode = function(code){
    return code=='it'?'it-IT':code;
  }

 
  return Filters;
}]);

angular
.module('paladinApp')
.component('search', {
  bindings: {

    filter:'='
  },
  controller: class FilterComponent {

  constructor($scope,$rootScope,$translate,apiService,enums) {
    this.scope = $scope;
    this.rootScope = $rootScope;
    this.translate = $translate;
    this.apiService = apiService;
    this.enums = enums;
  }

  $onInit() {
      var _this = this;
      this.scope.distanceDropDown = [{
            "l_id": 1,
            "distance":1,
            "name": "VC"
          }, {
            "l_id": 2,
            "distance":5,
            "name": "NB"
          }, {
            "l_id": 3,
            "distance":10,
            "name": "IC"
          },
          {
            "l_id": 4,
            "distance":50,
            "name": "IA"
          },
          {
            "l_id": 5,
            "distance":200,
            "name": "FA"
          }
      ];
      this.scope.distanceRange=200;
      this.selectedRange={
                                "l_id": 5,
                                "distance":200,
                                "name": "FA"
                              };
      this.scope.myModelVal= this.scope.distanceDropDown[4];

      this.scope.$on('distanceChanged', function(event, args){
        if (args) {
          _this.changeDistanceFilter();
        }
        _this.loading = false;
      });

      this.selectedItem = '';

  }

  initiateSearch(keyword) {
    if (keyword && keyword != '') {
      this.filter.search.searchStr = keyword;
      this.applySearch();
    }
  }

  onSearchTextChange() {
    if (this.filter.search.searchStr == '') 
      this.applySearch();
  }


searchBarOnKeyPress($event) {
    
    this.filter.search.searchStr = $event.target.value || '';
    
    if ($event.which == 13 && $event.target.value) {
        this.initiateSearch($event.target.value);
        
        var autoChild = document.getElementById('search-bar-browse-page').firstElementChild;
        var el = angular.element(autoChild);
        el.scope().$mdAutocompleteCtrl.hidden = true;
        $event.preventDefault();
    }
  }
  
  querySearch(textQuery) {
    if (textQuery && textQuery != '') {
    const query = textQuery.toLowerCase();
    return this.apiService.products.getSuggestions(query)
        .then((response) => {
            return [{Rank: Infinity, Keyword: textQuery},...response.Data.sort((a,b) => b.Rank - a.Rank)];
        })
    }
  }

  showLocation() {
    return this.filter.sortBy === this.enums.productsSortOptions.geoLocation;
  }
  

  onSelectedSuggestion(item,model,label,event) {
    this.filter.search.searchStr = item;
    event.stopPropagation();
  }
  onKeyPressed(event, item) {

    if (event.keyCode == 13) {
      applySearch();
    } 

    if (event.keyCode == 38 || event.keyCode == 40) {
      this.filter.search.searchStr = item; 
    }

  }
  

  changeDistanceFilter(){
      if(this.filter){
          this.filter.distanceRange=this.selectedRange.distance;
          this.applySearch();
      }
  }
  applySearch(){
      this.filter.currentPage =1;
      this.filter.search.currentSearchStr = this.filter.search.searchStr;
      this.rootScope.$broadcast('filtersUpdated');
  }
  addSuggestionToSearch(suggestion, loadResults) {
    this.filter.search.searchStr = suggestion;
    applySearch();
  }
  smallScreen() {
    return window.innerWidth<768;
  }
},
  templateUrl:'./views/templates/search.tpl.html'
});
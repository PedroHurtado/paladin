import * as vendor from '../vendor/externalvendor.js'

async function getComponents(){
    await import(/* webpackChunkName: "vendor" */'../vendor/vendor.js');
    await import(/* webpackChunkName: "app" */'./paladinapp/index.js');
    angular.bootstrap(document.querySelector(':root'),['paladinApp']);
};
getComponents();
 


import * as vendor from '../vendor/index.js';

async function getComponents(){
    await import(/* webpackChunkName: "uirouter" */'@uirouter/angularjs');
    await import(/* webpackChunkName: "angularmaterial" */'angular-material/angular-material');
};
getComponents();
 


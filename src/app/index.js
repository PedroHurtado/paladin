import {} from '../vendor/globalvendor';


async function getComponents(){
    await import(/* webpackChunkName: "vendor" */'../vendor/index.js');
    await import(/* webpackChunkName: "app" */'./paladinapp/index.js');
    angular.bootstrap(document.querySelector(':root'),['paladinApp']);
};
getComponents();

 


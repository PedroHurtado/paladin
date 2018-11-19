(function (window) {
    let glObj = {};

    glObj.ENV = 'prod';
    //glObj.ENV = 'test';
    //promotion
    glObj.IS_PROMO = true;
    glObj.START_DATE = "18";
    glObj.END_DATE = "19 Novembre";
    glObj.COUPON_VALUE = "25";
    glObj.COUPON_CODE = "WEEKEND25";
    glObj.PROMO_VERSION = "2";
    

    glObj.isProd = () => glObj.ENV === 'prod';

    glObj.SUPPORTED_LANGS = [
        {code:'en',name:'English', defaultLocation: 'milan italy',tryAndBuyWordPressPath: 'try-our-brands'},
        {code:'it',name:'Italiano', defaultLocation: 'milan italy',tryAndBuyWordPressPath: 'prova-i-nostri-brand'},
        // {code:'de',name:'Deutsch', defaultLocation: 'berlin germany',tryAndBuyWordPressPath: 'marken-anprobieren'}
    ];




    glObj.RENT_NOW_URL = 'https://qx87h.app.goo.gl/?link=https://paladintrue.com/{0}/?product-detail?{1}&apn=com.a2l.paladin&isi=1129780407&ibi=com.a2l.paladin&efr=1';
    glObj.RENT_URL = 'https://qx87h.app.goo.gl/?link=https://paladintrue.com/it&apn=com.a2l.paladin&isi=1129780407&ibi=com.a2l.paladin';

    if (glObj.ENV === 'prod') {
        glObj.ROOT_PATH = 'https://rent.paladintrue.com/'
        glObj.BASE_URL = 'https://live.v1.paladintrue.com/';
        glObj.PROFILE_IMAGE_URL = 'https://s3.eu-central-1.amazonaws.com/livepaladinimages/ProfileImage/'; // no suffix slash
        glObj.PRODUCT_IMAGE_URL = 'https://s3.eu-central-1.amazonaws.com/livepaladinimages/ProductImage/'; // no suffix slash
        glObj.CATEGORY_IMAGE_URL = 'https://s3.eu-central-1.amazonaws.com/livepaladinimages/CategoryImage/'; // no suffix slash
        glObj.LOG_LEVEL = 'none';
        glObj.STRIPE_SK = 'sk_live_n1ODuFHO82iZulfbRIBQ0WUa';

    } else {
        glObj.ROOT_PATH = 'https://webtest.paladintrue.com/'
        glObj.BASE_URL = 'https://staging.paladintrue.com/';
        glObj.PROFILE_IMAGE_URL = 'https://s3.eu-central-1.amazonaws.com/staggingimages/ProfileImage/'; // no suffix slash
        glObj.PRODUCT_IMAGE_URL = 'https://s3.eu-central-1.amazonaws.com/staggingimages/ProductImage/'; // no suffix slash
        glObj.CATEGORY_IMAGE_URL = 'https://s3.eu-central-1.amazonaws.com/staggingimages/CategoryImage/'; // no suffix slash
        glObj.LOG_LEVEL = 'verbose';
        glObj.STRIPE_SK = 'sk_test_Qxfl7rPTVALyVnrMRUkb2l3F';
    }

    glObj.API_URL = glObj.BASE_URL+'api/Paladin/'; // no suffix slash
    glObj.TOKEN_URL = glObj.BASE_URL+'Token'; // no suffix slash
    glObj.STRIPE_URL = 'https://api.stripe.com/v1';
    glObj.PROMO_SIGNUP_TIMER = 10000;
    window.globals = glObj;
})(window);

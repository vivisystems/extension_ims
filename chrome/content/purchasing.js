(function(){
    
    // include required models
    GeckoJS.include('chrome://viviecr/content/utils/syncbase_http_service.js');
    GeckoJS.include('chrome://viviecr/content/models/stock_record.js');
    
    GeckoJS.include('chrome://ims/content/models/supplier.js');
    GeckoJS.include('chrome://ims/content/models/PO.js');
    GeckoJS.include('chrome://ims/content/models/PO_detail.js');
    GeckoJS.include('chrome://ims/content/models/GR.js');
    GeckoJS.include('chrome://ims/content/models/GR_detail.js');
    GeckoJS.include('chrome://ims/content/models/product_cost.js');

    // include jquery extensions
    GeckoJS.include('chrome://ims/content/libs/sprintf.js');

    // include purchasing controller
    GeckoJS.include('chrome://ims/content/controllers/components/utilities.js');
    GeckoJS.include('chrome://ims/content/controllers/components/format_string.js');
    GeckoJS.include('chrome://ims/content/controllers/purchasing_controller.js');

    /**
     * Controller Startup
     */
    function startup() {
    
        $do('load', null, 'Purchasing');

    };

    window.addEventListener('load', startup, false);

})();



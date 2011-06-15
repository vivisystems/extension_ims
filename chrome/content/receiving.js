(function(){
    
    // include required models
    GeckoJS.include('chrome://viviecr/content/utils/syncbase_http_service.js');
    GeckoJS.include('chrome://viviecr/content/models/stock_record.js');
    
    GeckoJS.include('chrome://spims/content/models/supplier.js');
    GeckoJS.include('chrome://spims/content/models/PO.js');
    GeckoJS.include('chrome://spims/content/models/PO_detail.js');
    GeckoJS.include('chrome://spims/content/models/GR.js');
    GeckoJS.include('chrome://spims/content/models/GR_detail.js');
    GeckoJS.include('chrome://spims/content/models/product_cost.js');

    // include purchasing controller
    GeckoJS.include('chrome://spims/content/controllers/components/utilities.js');
    GeckoJS.include('chrome://spims/content/controllers/receiving_controller.js');

    /**
     * Controller Startup
     */
    function startup() {
    
        $do('load', null, 'Receiving');

    };

    window.addEventListener('load', startup, false);

})();



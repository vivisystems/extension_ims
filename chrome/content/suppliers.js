(function(){

    // include extension models
    GeckoJS.include('chrome://ims/content/models/supplier.js');


    // include extension controller
    GeckoJS.include('chrome://ims/content/controllers/supplier_controller.js');

    /**
     * Controller Startup
     */
    function startup() {

        $do('load', null, 'Suppliers');

    };

    window.addEventListener('load', startup, false);

})();


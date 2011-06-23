(function() {
    
    // include controllers  and register itself
    include( 'chrome://ims/content/reports/controllers/preview_goods_receiving_controller.js' );
    include( 'chrome://viviecr/content/reports/controllers/components/browser_print.js' );
    include( 'chrome://viviecr/content/reports/controllers/components/check_media.js' );

    /**
     * Controller Startup
     */
    function startup() {
        var data = window.arguments[0];

        $do( 'load', data, 'PreviewGoodsReceiving' );

    };

    window.addEventListener( 'load', startup, false );

} )();

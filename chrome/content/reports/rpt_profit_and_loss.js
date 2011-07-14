(function() {

    include( 'chrome://viviecr/content/models/category.js' );
    include( 'chrome://viviecr/content/models/order.js' );
    include( 'chrome://viviecr/content/models/order_item.js' );
    include( 'chrome://viviecr/content/models/product.js' );

    // include controllers  and register itself
    include( 'chrome://ims/content/reports/controllers/rpt_profit_and_loss_controller.js' );
    include( 'chrome://viviecr/content/reports/controllers/components/browser_print.js' );
    include( 'chrome://viviecr/content/reports/controllers/components/check_media.js' );

    /**
     * Controller Startup
     */
    function startup() {
        var data = window.arguments[0];

        $do( 'load', data, 'RptProfitAndLoss' );

    };

    window.addEventListener( 'load', startup, false );

} )();


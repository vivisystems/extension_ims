(function(){

    var __controller__ = {

        name: 'SPIMS-InitController',

        uses: ['ProductCost'],
        
        initial: function() {

            // load in String Bundles
            GeckoJS.StringBundle.createBundle("chrome://spims/locale/messages.properties");

            // create the following tables in the same datasource as inventory_records
            //
            // - suppliers
            // - POs
            // - PO_details
            // - GRs
            // - GR_details
            // - product_costs

            // create store for SupplierModel
            var supplierModel = new SupplierModel();
            supplierModel.createStore();
            
            // create store for POModel
            var poModel = new POModel();
            poModel.createStore();

            // create store for PODetailModel
            var poDetailModel = new PODetailModel();
            poDetailModel.createStore();
            
            // create store for GRModel
            var grModel = new GRModel();
            grModel.createStore();

            // create store for GRDetailModel
            var grDetailModel = new GRDetailModel();
            grDetailModel.createStore();

            // create store for ProductCostModel
            var productCostModel = new ProductCostModel();
            productCostModel.createStore();

            // create store for OrderItemCostModel
            var orderItemCostModel = new OrderItemCostModel();
            orderItemCostModel.createStore();

            // cache product costs
            this.ProductCost.cacheProductCosts();
        }
    };

    GeckoJS.Controller.extend(__controller__);

    // register onload
    window.addEventListener('load', function() {
        $do('initial', null, 'SPIMS-InitController')
    }, false);
})();

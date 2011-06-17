(function(){

    var __controller__ = {

        name: 'IMS-InitController',

        uses: ['ProductCost', 'Supplier', 'PO', 'PODetail', 'GR', 'GRDetail', 'OrderItemCost'],
        
        initial: function() {

            // load in String Bundles
            GeckoJS.StringBundle.createBundle("chrome://ims/locale/messages.properties");

            // create the following tables in the same datasource as inventory_records
            //
            // - POs
            // - PO_details
            // - GRs
            // - GR_details
            // - product_costs
            // - order_item_costs
            // - suppliers

            // create store for POModel
            if (!this.PO.createStore()) {
                this._dbError(this.PO.lastError,
                              this.PO.lastErrorString,
                              _('An error was encountered while creating the purchase order table (error code %S) [message #IMS-01-01].', [this.PO.lastError]));
            }

            // create store for PODetailModel
            if (!this.PODetail.createStore()) {
                this._dbError(this.PODetail.lastError,
                              this.PODetail.lastErrorString,
                              _('An error was encountered while creating the purchase order detail table (error code %S) [message #IMS-01-02].', [this.PODetail.lastError]));
            }
            
            // create store for GRModel
            if (!this.GR.createStore()) {
                this._dbError(this.GR.lastError,
                              this.GR.lastErrorString,
                              _('An error was encountered while creating the goods receiving table (error code %S) [message #IMS-01-03].', [this.GR.lastError]));
            }

            // create store for GRDetailModel
            if (!this.GRDetail.createStore()) {
                this._dbError(this.GRDetail.lastError,
                              this.GRDetail.lastErrorString,
                              _('An error was encountered while creating the goods receiving detail table (error code %S) [message #IMS-01-04].', [this.GRDetail.lastError]));
            }

            // create store for ProductCostModel
            if (!this.ProductCost.createStore()) {
                this._dbError(this.ProductCost.lastError,
                              this.ProductCost.lastErrorString,
                              _('An error was encountered while creating the product cost table (error code %S) [message #IMS-01-05].', [this.ProductCost.lastError]));
            }

            // create store for OrderItemCostModel
            if (!this.OrderItemCost.createStore()) {
                this._dbError(this.OrderItemCost.lastError,
                              this.OrderItemCost.lastErrorString,
                              _('An error was encountered while creating the order item cost table (error code %S) [message #IMS-01-06].', [this.OrderItemCost.lastError]));
            }

            // create store for SupplierModel
            if (!this.Supplier.createStore()) {
                this._dbError(this.Supplier.lastError,
                              this.Supplier.lastErrorString,
                              _('An error was encountered while creating the supplier table (error code %S) [message #IMS-01-07].', [this.Supplier.lastError]));
            }

            // cache product costs
            this.ProductCost.cacheProductCosts();
            
        },

        _dbError: function(errno, errstr, errmsg) {
            this.log('ERROR', errmsg + '\nDatabase Error [' +  errno + ']: [' + errstr + ']');
            GREUtils.Dialog.alert(this.topmostWindow,
                                  _('Data Operation Error'),
                                  errmsg + '\n\n' + _('Please restart the machine, and if the problem persists, please contact technical support immediately.'));
        }
    };

    GeckoJS.Controller.extend(__controller__);

    // register onload
    window.addEventListener('load', function() {
        $do('initial', null, 'IMS-InitController')
    }, false);
})();

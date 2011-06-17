(function(){

    var __controller__ = {

        name: 'IMS-PLUSController',

        uses: ['StockRecord'],

        _productRowObj: null,
        
        isStockControlServer: function() {
            return !this.StockRecord.isRemoteService();
        },

        initial: function() {
            this._productRowObj = document.getElementById('product-extra');
            
            // should we be visible?
            if (this.isStockControlServer()) {

                // identify product row overlay target since desired target does not have any identifying attribute associated with it
                var saleUnitObj = document.getElementById('sale_unit');
                if (saleUnitObj &&
                    saleUnitObj.parentNode && // vbox)
                    saleUnitObj.parentNode.parentNode && // row
                    saleUnitObj.parentNode.parentNode.parentNode) { // rows
                        var rows = saleUnitObj.parentNode.parentNode.parentNode;
                        rows.appendChild(this._productRowObj);
                }
            }
        }
    };

    GeckoJS.Controller.extend(__controller__);

    // register onload
    window.addEventListener('load', function() {
        $do('initial', null, 'IMS-PLUSController')
    }, false);
})();

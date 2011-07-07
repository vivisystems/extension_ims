(function(){

    var __controller__ = {

        name: 'IMS-PLUSController',

        uses: ['StockRecord', 'ProductCost'],

        _productRowObj: null,
        _prodNo: null,
        _buyPrice: null,

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

                // add listener to handle modify and remove events
                var plusController = GeckoJS.Controller.getInstanceByName('Plus');
                if (plusController) {
                    plusController.addEventListener('beforeFilter', this.handleBefore, this);
                    plusController.addEventListener('onModify', this.handleModify, this);
                    plusController.addEventListener('onRemove', this.handleRemove, this);
                }
            }
        },

        handleBefore: function(evt) {
            // this is to capture the product no being modified/removed
            if (evt.data == 'modify' || evt.data == 'remove') {
                var prodObj = document.getElementById('product_no');
                var buyPriceObj = document.getElementById('buy_price');
                if (prodObj) {
                    this._prodNo = prodObj.value;
                }
                else {
                    this._prodNo = null;
                }

                if (buyPriceObj) {
                    this._buyPrice = parseFloat(buyPriceObj.getAttribute('org_value'));
                    if (isNaN(this._buyPrice)) this._buyPrice = null;
                }
                else {
                    this._buyPrice = null;
                }
            }
        },

        handleModify: function(evt) {
            if (this._prodNo) {
                var buyPriceObj = document.getElementById('buy_price');
                if (buyPriceObj) {
                    var buyPrice = parseFloat(buyPriceObj.value);
                    var record = this.ProductCost.findById(this._prodNo);

                    if (isNaN(buyPrice)) buyPrice = null;

                    if (buyPrice != null && (buyPrice != this._buyPrice || !record)) {
                        if (!record) {
                            record = {
                                id: this._prodNo,
                                avg_cost: 0,
                                last_cost: 0,
                                manual_cost: buyPrice,
                                acc_qty: 0
                            }
                        }
                        else
                            record.manual_cost = buyPrice;
                        this.ProductCost.id = record.id;
                        this.ProductCost.save(record);
                    }
                }
            }
        },

        handleRemove: function(evt) {
            if (this._prodNo) {
                this.ProductCost.del(this._prodNo);
            }
        }
    };

    GeckoJS.Controller.extend(__controller__);

    // register onload
    window.addEventListener('load', function() {
        $do('initial', null, 'IMS-PLUSController')
    }, false);
})();

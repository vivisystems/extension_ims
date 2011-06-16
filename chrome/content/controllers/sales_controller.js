(function(){

    var __controller__ = {

        name: 'SPIMS-SalesController',

        uses: ['OrderItemCost'],
        
        initial: function() {
            var cart = GeckoJS.Controller.getInstanceByName('Cart');
            if (cart) {
                cart.addEventListener('afterSubmit', this.updateProductCosts, this);

                // truncate & expire
            }
        },

        updateProductCosts: function(evt) {
            var txn = evt.data;
            if (txn && txn.data && txn.data.status == 1 && txn.data.items) {
                this.OrderItemCost.saveItemCosts(txn.data.items);
            }
        }
    };

    GeckoJS.Controller.extend(__controller__);

    // register onload
    window.addEventListener('load', function() {
        var main = GeckoJS.Controller.getInstanceByName('Main');
        if(main) main.addEventListener('afterInitial', function() {
                                            main.requestCommand('initial', null, 'SPIMS-SalesController');
                                      });

    }, false);
})();

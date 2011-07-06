(function(){

    var __controller__ = {

        name: 'IMS-SalesController',

        uses: ['OrderItemCost', 'PO', 'PODetail', 'GR', 'GRDetail', 'ProductCost'],
        
        initial: function() {
            var cart = GeckoJS.Controller.getInstanceByName('Cart');
            if (cart) {
                cart.addEventListener('afterSubmit', this.storeItemCosts, this);
            }

            // truncate & expire
            var main = GeckoJS.Controller.getInstanceByName('Main');
            if (main) {
                main.addEventListener('afterClearOrderData', this.expireData, this);
                main.addEventListener('afterTruncateTxnRecords', this.truncateData, this);
            }
        },

        storeItemCosts: function(evt) {
            var isTraining = GeckoJS.Session.get( "isTraining" ) || false;

            if (!isTraining) {
                var txn = evt.data;
                if (txn && txn.data && txn.data.status == 1 && txn.data.items) {
                    var rc = this.OrderItemCost.saveItemCosts(txn.data.items);

                    if (!rc) {
                        this._dbError(this.OrderItemCost.lastError,
                                      this.OrderItemCost.lastErrorString,
                                      _('Failed to store order item costs (error code %S) [message #IMS-02-01].', [this.OrderItemCost.lastError]));
                    }
                    else {
                        for (var i = 0; i < rc.length; i++) {
                            if (!rc[i]) {
                                this._dbError(this.OrderItemCost.lastError,
                                              this.OrderItemCost.lastErrorString,
                                              _('Failed to store order item costs (error code %S) [message #IMS-02-02].', [this.OrderItemCost.lastError]));
                                return false;
                            }
                        }
                    }
                }
            }
            return true;
        },

        expireData: function(evt) {
            var conditions = 'NOT EXISTS (SELECT id FROM order_items WHERE order_items.id = order_item_costs.id)';

            var result = false;
            var isMoveToHistory = GeckoJS.Configure.read('vivipos.fec.settings.moveExpiredDataToHistory') || false;
            var attachedOrderHistory = isMoveToHistory ? this.OrderItemCost.attachOrderHistory() : false;
            
            try {
                // update progressbar...
                GeckoJS.BaseObject.sleep(50);

                // order item costs
                if (attachedOrderHistory) {
                    // copy item taxes to history
                    if (!this.OrderItemCost.execute("INSERT OR REPLACE INTO order_history." + this.OrderItemCost.table + " SELECT * FROM " + this.OrderItemCost.table + " WHERE " + conditions)) {
                        throw {
                            errno: this.OrderItemCost.lastError,
                            errstr: this.OrderItemCost.lastErrorString,
                            errmsg: _('An error was encountered while archiving order item costs (error code %S) [message #IMS-02-03].', [this.OrderItemCost.lastError])
                        }
                    }
                }
                if (!this.OrderItemCost.execute("DELETE FROM " + this.OrderItemCost.table + " WHERE " + conditions)) {
                    throw {
                        errno: this.OrderItemCost.lastError,
                        errstr: this.OrderItemCost.lastErrorString,
                        errmsg: _('An error was encountered while removing order item costs (error code %S [message #IMS-02-04].', [this.OrderItemCost.lastError])
                    }
                }
                result = true;
            }
            catch(e) {
                this._dbError(e.errno, e.errstr, e.errmsg);

            } finally {
                if (attachedOrderHistory) {
                    this.OrderItemCost.detachOrderHistory();
                }
            }
            return result;
        },

        truncateData: function(evt) {
            try {
                var r = this.PO.execute('delete from POs');
                if (!r) {
                    throw {errno: this.PO.lastError,
                           errstr: this.PO.lastErrorString,
                           errmsg: _('An error was encountered while removing all purchase orders (error code %S) [message #IMS-02-05].', [this.PO.lastError])};
                }

                r = this.PODetail.execute('delete from PO_details');
                if (!r) {
                    throw {errno: this.PODetail.lastError,
                           errstr: this.PODetail.lastErrorString,
                           errmsg: _('An error was encountered while removing all purchase order details (error code %S) [message #IMS-02-06].', [this.PODetail.lastError])};
                }

                var r = this.GR.execute('delete from GRs');
                if (!r) {
                    throw {errno: this.GR.lastError,
                           errstr: this.GR.lastErrorString,
                           errmsg: _('An error was encountered while removing all goods receiving records (error code %S) [message #IMS-02-07].', [this.GR.lastError])};
                }

                r = this.GRDetail.execute('delete from GR_details');
                if (!r) {
                    throw {errno: this.GRDetail.lastError,
                           errstr: this.GRDetail.lastErrorString,
                           errmsg: _('An error was encountered while removing all goods receiving details(error code %S) [message #IMS-02-08].', [this.GRDetail.lastError])};
                }

                r = this.ProductCost.execute('delete from product_costs');
                if (!r) {
                    throw {errno: this.ProductCost.lastError,
                           errstr: this.ProductCost.lastErrorString,
                           errmsg: _('An error was encountered while removing all product cost records (error code %S) [message #IMS-02-09].', [this.ProductCost.lastError])};
                }

                r = this.OrderItemCost.execute('delete from order_item_costs');
                if (!r) {
                    throw {errno: this.OrderItemCost.lastError,
                           errstr: this.OrderItemCost.lastErrorString,
                           errmsg: _('An error was encountered while removing all item cost records (error code %S) [message #IMS-02-10].', [this.OrderItemCost.lastError])};
                }
            }
            catch(e) {
                this._dbError(e.errno, e.errstr, e.errmsg);
            }
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
        $do('initial', null, 'IMS-SalesController');
    }, false);
    
})();

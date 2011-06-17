(function(){

    var __controller__ = {

        name: 'IMS-PLUSearchController',

        uses: ['GRDetail'],

        components: ['Utility'],
        
        _pricesToShow: 5,

        _plusearchController: null,
        _lastSelectedNO: '',
        _priceListObj: null,
        _productRowObj: null,
        
        initial: function() {
            this._priceListObj = document.getElementById('lastpricecrollablepanel');
            this._productRowObj = document.getElementById('product-extra');
            this._moreBtnObj = document.getElementById('more');
            
            // should we be visible?
            if (this._priceListObj && window.arguments && (window.arguments.length > 0)) {
                var inputObj = window.arguments[0];

                if (inputObj.showLastPrices) {

                    // add listener to capture product select event
                    this._plusearchController = GeckoJS.Controller.getInstanceByName('PluSearch');
                    this._plusearchController.addEventListener('onSelect', this.updateLastPrices, this);
                    this._plusearchController.addEventListener('onSearchPlu', this.updateLastPrices, this);
                    this._plusearchController.addEventListener('onSearchPlu2', this.updateLastPrices, this);
                    this._plusearchController.addEventListener('onSetSelections', this.selectProduct, this);

                    // identify last price overlay target since desired target does not have any identifying attribute associated with it
                    var tabpanels = $('tabpanel');
                    for (var i = 0; i < tabpanels.length; i++) {
                        let parentID = tabpanels[i].parentNode.getAttribute('id');
                        if (parentID.length == 0) {
                            
                            // attach to target
                            tabpanels[i].appendChild(this._priceListObj);
                            break;
                        }
                    }

                    // identify product row overlay target since desired target does not have any identifying attribute associated with it
                    var saleUnitObj = document.getElementById('sale_unit');
                    if (saleUnitObj &&
                        saleUnitObj.parentNode && // vbox)
                        saleUnitObj.parentNode.parentNode && // row
                        saleUnitObj.parentNode.parentNode.parentNode) { // rows
                            var rows = saleUnitObj.parentNode.parentNode.parentNode;
                            rows.appendChild(this._productRowObj);
                    }

                    // identify more button target since desired target does not have any identifying attribute associated with it
                    var selectBtnObj = document.getElementById('ok');
                    if (selectBtnObj &&
                        selectBtnObj.parentNode) { // hbox
                            var hbox = selectBtnObj.parentNode;
                            hbox.insertBefore(this._moreBtnObj, selectBtnObj);

                            selectBtnObj.setAttribute('label', _('Select & Close'));
                    }
                }
            }
        },

        selectProduct: function(evt) {
            var prod;
            if (window.arguments[0] != null && window.arguments[0].selections != null) {
                prod = window.arguments[0].selections[0];
            }

            if (prod) {
                var aURL = 'chrome://ims/content/dialogs/prompt_qty_price.xul';
                var aName = _('Purchase Details');
                var aFeatures = 'chrome,dialog,modal,centerscreen,dependent=yes,resize=no,width=' + this.screenwidth*0.7 + ',height=' + this.screenheight*0.8;
                var aArguments = {
                    product: '[' + prod.name + ' (' + prod.no + ')]',
                    precision: GeckoJS.Configure.read('vivipos.fec.settings.PrecisionPrices') || 0
                };

                GREUtils.Dialog.openWindow(this.topmostWindow, aURL, aName, aFeatures, aArguments);

                if (!aArguments.ok) {
                    // clear out selection
                    delete window.arguments[0].item;
                }
                else {
                    window.arguments[0].qty = aArguments.qty;
                    window.arguments[0].price = aArguments.price;
                    window.arguments[0].cost = aArguments.cost;
                }
            }
        },

        selectMoreProducts: function() {
            $do('setSelections', null, 'PluSearch');
            var args = window.arguments[0];
            if (args && args.item && args.moreCB && args.scope) {
                args.moreCB(args.item.id, args.qty, args.price, args.cost, args.scope);

                OsdUtils.info(_('Product [%S (%S)] added', [args.item.name, args.item.no]));
            }
        },
        
        updateLastPrices: function(evt) {
            var no = '';
            var selectedTab = document.getElementById('mode_tabs').selectedIndex;

            if (selectedTab == 0) {
                // browse mode
                no = (document.getElementById('product_no').value || '').trim();
            }
            else if (selectedTab == 1) {
                // search mode
                var plusearchscrollablepanel = document.getElementById('plusearchscrollablepanel');
                var selectedItems = plusearchscrollablepanel.selectedItems || [];
                if (selectedItems.length > 0) {
                    no = (document.getElementById('product_no').value || '').trim();
                }
            }

            if (this._lastSelectedNo == no) return;

            var lastPrices = [];
            if (no != '' && no.length > 0) {
                var lastPriceRecords = this.GRDetail.find('all', {
                    conditions: 'GR_details.no = "' + no + '" AND GR_details.commit_date NOT NULL',
                    recursive: 1,
                    limit: this._pricesToShow,
                    order: 'GR_details.commit_date DESC'
                });

                if (lastPriceRecords) {
                    lastPriceRecords.forEach(function(p) {
                        lastPrices.push({
                            modified: new Date(p.commit_date * 1000).toLocaleDateString(),
                            grnumber: p.GR.no,
                            qty: p.commit_qty,
                            supplier: p.GR.supplier_name + ' (' + p.GR.supplier_code + ')',
                            unitprice: this.Utility.formatPrice(p.commit_price)
                        })
                    }, this)
                }
                else {
                    this._dbError(this.GRDetail.lastError,
                                  this.GRDetail.lastErrorString,
                                  _('An error was encountered while retrieving goods receiving records (error code %S) [message #IMS-03-01].', [this.GRDetail.lastError]));
                }
            }
            this._priceListObj.datasource = lastPrices;
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
        $do('initial', null, 'IMS-PLUSearchController')
    }, false);
})();

(function(){

    var __controller__ = {

        name: 'Receiving',

        uses: ['PO', 'PODetail', 'GR', 'GRDetail', 'StockRecord', 'ProductCost', 'Supplier', 'InventoryCommitment', 'InventoryRecord'],

        components: ['Utility'],
        
        screenwidth: GeckoJS.Configure.read('vivipos.fec.mainscreen.width') || 800,
        screenheight: GeckoJS.Configure.read('vivipos.fec.mainscreen.height') || 600,

        _gr: null,
        _grListObj: null,
        _grList: [],
        _detailListObj: null,
        _detailList: [],
        _mode: 0,
        _supplierFilter: [],
        _POs: [],
        _terminal: GeckoJS.Session.get('terminal_no'),
        _user: _('unknown user'),
        _username: _('unknown username'),
        _branchId: '',
        _precision: GeckoJS.Configure.read('vivipos.fec.settings.PrecisionPrices') || 0,
        _grAttrs: ['id',
                   'no',
                   'desc',
                   'total'],
        _itemAttrs: ['seq',
                     'no',
                     'name',
                     'qty',
                     'price',
                     'total'],

        load: function() {
            // check if Stock Control server
            if (this.isStockControlServer()) {

                if (this.Acl) {
                    var clerk = this.Acl.getUserPrincipal();
                    if (clerk) {
                        this._user = clerk.username;
                        this._username = clerk.description || clerk.username;
                    }
                }

                var storeContact = GeckoJS.Session.get('storeContact');
                if (storeContact)
                    this._branchId = storeContact.branch_id;

                // load open POs
                this.loadOpenPOs();

                // initialize supplier filter menu
                this.buildSupplierFilterMenu();

                // set search date range to last week
                var now = Date.today();
                var lastWeek = Date.today().addMonths(-1);
                this.setSearchDateRange(lastWeek, now);

                // count total number of GRs
                this.updateGRCountDisplay(null, null, this.countAllGRs());

                // force search mode
                this.searchMode();
            }
            else {
                this.displayNoAccessMessage();
            }
        },

        displayNoAccessMessage: function() {
            var serverName = this.StockRecord.getHostname();
            GREUtils.Dialog.alert(this.topmostWindow, _('Access to Goods Receiving Not Available'),
                                                      _('Goods Receiving may only be managed from the designated Stock Control Service Master at [%S]', [serverName]));
            window.close();
        },

        isStockControlServer: function() {
            return !this.StockRecord.isRemoteService();
        },

        getSupplierByCode: function(code) {
            var supplier = this.Supplier.findByIndex('first', {
                index: 'code',
                value: code
            });
            if (supplier === false) {
                this._dbError(this.Supplier.lastError,
                              this.Supplier.lastErrorString,
                              _('Failed to retrieve supplier record from database (error code %S) [message #IMS-04-15].', [this.Supplier.lastError]));
            }
            return supplier;
        },

        loadOpenPOs: function() {
            var POs = this.PO.find('all', {
                fields: ['no', 'total', 'supplier_name', 'supplier_code', 'supplier_name || " (" || supplier_code || ")" AS supplier'],
                recursive: 1,
                conditions: 'open = 1',
                order: 'no ASC'
            });

            if (!POs) {
                this._dbError(this.PO.lastError,
                              this.PO.lastErrorString,
                              _('Failed to retrieve purchase orders from database (error code %S) [message #IMS-05-01].', [this.PO.lastError]));
                POs = [];
            }

            this._POs = POs;
        },

        searchMode: function() {
            if (this._mode == 1 && !this.confirmDiscardChanges()) {
                document.getElementById('main_tabs').selectedIndex = 1;
                return;
            }

            this._mode = document.getElementById('main_tabs').selectedIndex = 0;

            // clear detail list selection
            GeckoJS.FormHelper.reset('editForm')
            this.getDetailListObj().selection.clearSelection();
            this.getDetailListObj().datasource = [];
            
            // search for GRs
            this.updateGRList();
        },

        countAllGRs: function() {
            var count = this.GR.findCount();

            if (isNaN(parseInt(count))) {
                this.log('ERROR', 'Failed to retrieve GR count');
                count = 0;
            }

            return count;
        },

        getGRListObj: function() {
            if (!this._grListObj) {
                this._grListObj = document.getElementById('grscrollabletree');
            }
            return this._grListObj;
        },

        getDetailListObj: function() {
            if (!this._detailListObj) {
                this._detailListObj = document.getElementById('detailscrollabletree');
            }
            return this._detailListObj;
        },

        buildSupplierFilterMenu: function() {

            // build supplier filter menu
            var supplierFilter = this.GR.findSuppliers();

            if (!supplierFilter) {
                this._dbError(this.GR.lastError,
                              this.GR.lastErrorString,
                              _('Failed to retrieve supplier records from database (error code %S) [message #IMS-05-02].', [this.GR.lastError]));
                supplierFilter = [];
            }
            else {
                var filterMenuObj = document.getElementById('filter_supplier');
                if (supplierFilter != null && supplierFilter.length > 0 && filterMenuObj != null) {
                    while (filterMenuObj.itemCount > 1) {
                        filterMenuObj.removeItemAt(1);
                    }
                    supplierFilter.forEach(function(s, index) {
                        filterMenuObj.appendItem(s.supplier_name + ' (' + s.supplier_code + ')', index, '');
                    });
                }
            }
            
            this._supplierFilter = supplierFilter;
        },

        setSearchDateRange: function(startDate, endDate) {
            var startDateObj = document.getElementById('filter_startdate');
            var endDateObj = document.getElementById('filter_enddate');
            
            endDateObj.value = endDate.getTime();
            startDateObj.value = startDate.getTime();
        },

        queryGRList: function() {
            
            var startTimestamp = parseInt(document.getElementById('filter_startdate').value);
            var endTimestamp = parseInt(document.getElementById('filter_enddate').value);
            var grNumber = document.getElementById('filter_gr_number').value || '';
            var poNumber = document.getElementById('filter_po_number').value || '';
            var supplierIndex = parseInt(document.getElementById('filter_supplier').value);
            var status = parseInt(document.getElementById('filter_status').value);
            var startIndex = parseInt(document.getElementById('search_limit_start').value);
            var limit = parseInt(document.getElementById('search_limit_size').value);
            var supplierCode = '';
            var supplierName = '';

            // adjust endTimestamp by 1 day
            if (!isNaN(endTimestamp)) endTimestamp += (1000 * 60 * 60 * 24);

            // retrieve supplier code & name
            if (!isNaN(supplierIndex) && this._supplierFilter[supplierIndex]) {
                supplierCode = this._supplierFilter[supplierIndex].supplier_code || '';
                supplierName = this._supplierFilter[supplierIndex].supplier_name || '';
            }
            var grList = this.GR.findGRList(startTimestamp, endTimestamp, grNumber, poNumber, supplierCode, supplierName, status, startIndex, limit);

            if (!grList) {
                this._dbError(this.GR.lastError,
                              this.GR.lastErrorString,
                              _('Failed to retrieve goods receiving records from database (error code %S) [message #IMS-05-03].', [this.GR.lastError]));
                grList = {list: [],
                          count: 0};
            }
            else {
                grList.list.forEach(function(gr, index) {
                    gr.status = gr.open ? _('(ims)GR Status Open') : _('(ims)GR Status Closed');
                    gr.created_date = new Date(gr.created * 1000).toLocaleDateString();
                    gr.supplier = gr.supplier_name + ' (' + gr.supplier_code + ')';
                    gr.total_display = this.Utility.formatPrice(gr.total);

                    // lock GR if committed and entry count > 0
                    gr.locked = gr.committed && gr.count > 0;
                }, this)
            }
            return grList;
        },

        updateGRCountDisplay: function(shown, found, total) {
            if (shown != null) document.getElementById('search_result_displayed').value = shown;
            if (found != null) document.getElementById('search_result_count').value = found;
            if (total != null) document.getElementById('search_result_total').value = total;
        },

        updateGRList: function() {
            var grListObj = this.getGRListObj();
            var grList = this.queryGRList();

            // clear current selection
            grListObj.selection.clearSelection();
            grListObj.selectedIndex = -1;
            
            // set datasource to new GR list
            grListObj.datasource = this._grList = grList.list;

            this.updateGRCountDisplay(this._grList.length, grList.count, null);

            this.validateForm();
        },

        selectGR: function() {
            this.validateForm();
        },

        deleteGR: function() {
            var grListObj = this.getGRListObj();
            var selectedIndex = grListObj.selectedIndex;

            if (selectedIndex > -1 && !this._grList[selectedIndex].locked) {
                var gr = this._grList[selectedIndex];
                if (!GREUtils.Dialog.confirm(this.topmostWindow,
                                             _('confirm delete GR [%S]', [gr.no]),
                                             _('Are you sure you want to delete GR [%S]?', [gr.no]))) {
                    return;
                }

                // delete GR record
                if (this.GR.del(gr.id, true)) {

                    // update cached GR list
                    this._grList.splice(selectedIndex, 1);
                    grListObj.datasource = this._grList;

                    // update selected index
                    if (selectedIndex >= this._grList.length) selectedIndex--;
                    grListObj.selection.select(selectedIndex);

                    this.validateForm();
                }
                else {
                    this._dbError(this.GR.lastError,
                                  this.GR.lastErrorString,
                                  _('Failed to delete goods receiving record from database (error code %S) [message #IMS-05-04].', [this.GR.lastError]));
                }
            }
        },

        addGR: function(clear) {
            $.popupPanel('promptAddGRPanel', {POs: this._POs,
                                              okCB: this.createMode,
                                              clear: clear,
                                              scope: this});
        },

        createMode: function(grnumber, description, po, self) {
            // check for duplicate po number
            var gr = self.GR.findByIndex('first', {index: 'no', value: grnumber});
            if (gr) {
                GREUtils.Dialog.alert(self.topmostWindow, _('Duplicate GR Number'),
                                                          _('GR Number [%S] already exists, please enter a different GR number.', [grnumber]))
                self.addGR(false);
                return;
            }
            else if (gr === false) {
                this._dbError(this.GR.lastError,
                              this.GR.lastErrorString,
                              _('An error was encountered while validating goods receiving number (error code %S) [message #IMS-05-05].', [this.GR.lastError]));
                return;
            }

            var today = new Date();

            // bring in details from PO
            var poItems = self.PO.getItems(po.id);
            var detailList = poItems.map(function(p) {
                var item = {pending: true,
                            id: '',
                            gr_id: '',
                            seq: p.seq,
                            no: p.no,
                            name: p.name,
                            qty: p.qty,
                            order_qty: p.qty,
                            unit: p.unit,
                            price: p.price,
                            total: p.total};
                return self.formatItem(item);
            });
            
            // create GR header
            self._gr = {id: '',
                        no: grnumber,
                        desc: description || '',
                        po_no: po.no,
                        po_open: 1,
                        supplier_code: po.supplier_code,
                        supplier_name: po.supplier_name,
                        supplier: po.supplier,
                        created_date: today.toLocaleDateString(),
                        total: po.total,
                        total_display: self.Utility.formatPrice(po.total),
                        open: 1,
                        count: detailList.length,
                        committed: 0,
                        status: _('(ims)PO Status Open'),
                        clerk: self._user,
                        clerk_name: self._username,
                        terminal: self._terminal
            };

            GeckoJS.FormHelper.unserializeFromObject('editForm', self._gr);

            document.getElementById('create_gr').hidden = false;
            document.getElementById('cancel_create').hidden = false;
            document.getElementById('save_changes').hidden = true;
            document.getElementById('discard_changes').hidden = true;
            document.getElementById('print_gr').hidden = true;

            document.getElementById('tab_detail').removeAttribute('disabled');
            self._mode = document.getElementById('main_tabs').selectedIndex = 1;

            // initialize detail List
            self.getDetailListObj().datasource = self._detailList = detailList;
            self._savedDetailList = [];

            self.validateSaveDiscard();
        },

        isGRCommitted: function(items) {
            if (!items || items.length == 0) return false;

            for (var i = 0; i < items.length; i++) {
                if (items[i].commit_date != null && items[i].commit_date != '') return true;
            }

            return false;
        },

        filterEmptyItems: function(items) {
            var filteredItems = [];
            var count = 1;
            items.forEach(function(p) {
                if (p.qty > 0) {
                    var q = GREUtils.extend({}, p);
                    q.seq = count++;
                    filteredItems.push(q);
                }
            })
            return filteredItems;
        },

        updateGR: function(data, commit) {
            // update clerk & terminal
            data.clerk = this._user;
            data.clerk_name = this._username;
            data.terminal = this._terminal;
            data.count = this._detailList.length;
            data.committed = this.isGRCommitted(this._detailList);

            this.GR.id = data.id;
            if (!this.GR.save(data)) {
                this._dbError(this.GR.lastError,
                              this.GR.lastErrorString,
                              _('Failed to update goods receiving record (error code %S) [message #IMS-05-06].', [this.GR.lastError]));
                return false;
            }

            var detailList = commit ? this.filterEmptyItems(this._detailList) : this._detailList;
            var rc = this.GRDetail.replaceRecords(data.id, detailList);
            if (!rc) {
                this._dbError(this.GRDetail.lastError,
                              this.GRDetail.lastErrorString,
                              _('Failed to store goods receiving detail into database (error code %S) [message #IMS-05-07].', [this.GRDetail.lastError]));
                return false;
            }
            else {
                for (var i = 0; i < rc.length; i++) {
                    if (!rc[i]) {
                        this._dbError(this.GRDetail.lastError,
                                      this.GRDetail.lastErrorString,
                                      _('Failed to store goods receiving detail into database (error code %S) [message #IMS-05-08].', [this.GRDetail.lastError]));
                        return false;
                    }
                }
            }
            return true;
        },

        createGR: function(data, commit) {
            // update clerk & terminal
            data.clerk = this._user;
            data.clerk_name = this._username;
            data.terminal = this._terminal;
            data.count = this._detailList.length;
            data.committed = this.isGRCommitted(this._detailList);

            this.GR.id = data.id = GeckoJS.String.uuid();
            if (!this.GR.save(data)) {
                this._dbError(this.GR.lastError,
                              this.GR.lastErrorString,
                              _('Failed to create goods receiving record (error code %S) [message #IMS-05-09].', [this.GR.lastError]));
                return false;
            }

            this._detailList.forEach(function(p) {
                p.id = GeckoJS.String.uuid();
                p.gr_id = data.id;
                p.clerk = this._user;
                p.clerk_name = this._username;
            }, this);

            var detailList = commit ? this.filterEmptyItems(this._detailList) : this._detailList;
            var rc = this.GRDetail.saveAll(detailList);
            if (!rc) {
                this._dbError(this.GRDetail.lastError,
                              this.GRDetail.lastErrorString,
                              _('Failed to insert goods receiving detail into database (error code %S) [message #IMS-05-10].', [this.GRDetail.lastError]));
                return false;
            }
            else {
                for (var i = 0; i < rc.length; i++) {
                    if (!rc[i]) {
                        this._dbError(this.GRDetail.lastError,
                                      this.GRDetail.lastErrorString,
                                      _('Failed to insert goods receiving detail into database (error code %S) [message #IMS-05-11].', [this.GRDetail.lastError]));
                        return false;
                    }
                }
            }
            return true;
        },

        saveChanges: function() {
            var data = GeckoJS.FormHelper.serializeToObject('editForm');

            if (data.id && data.id.length > 0) {
                // edit
                this.updateGR(data, false);

                OsdUtils.info(_('Goods Receiving [%S] successfully updated', [data.no]));
            }
            else {
                // create
                this.createGR(data, false);

                OsdUtils.info(_('Goods Receiving [%S] successfully created', [data.no]));
            }
            // rebuild supplier filter menu
            this.buildSupplierFilterMenu();

            // switch to editMode
            this.editMode(data);
        },

        commitGR: function() {
            var created = false;
            var updated = false;
            var committed = false;

            var pendingCommit = this.isGRPendingCommit();
            var modified = this.isGRModified();

            var data = GeckoJS.FormHelper.serializeToObject('editForm');
            if (pendingCommit) {
                if (!this.ProductCost.begin()) {
                    this._dbError(this.ProductCost.lastError,
                                  this.ProductCost.lastErrorString,
                                  _('Failed to obtain lock on database (error code %S) [message #IMS-05-12].', [this.ProductCost.lastError]));
                }
                else {
                    try {

                        this._detailList.forEach(function(p) {
                            delete p.last_price;
                            delete p.last_qty;

                            if (p.pending) {
                                var weight_delta;
                                var qty_delta;

                                // save original price & qty
                                p.last_price = p.commit_price;
                                p.last_qty = p.commit_qty;

                                // compute change in qty and weight
                                if (isNaN(parseFloat(p.commit_qty))) {
                                    qty_delta = p.qty;
                                    weight_delta = p.qty * p.price;
                                }
                                else {
                                    qty_delta = p.qty - p.commit_qty;
                                    weight_delta = p.qty * p.price - p.commit_qty * p.commit_price;
                                }

                                p.commit_date = new Date().getTime() / 1000;
                                p.commit_clerk = this._user;
                                p.commit_clerk_name = this._username;
                                p.commit_price = p.price;
                                p.commit_qty = p.qty;
                                if (!this.updateLastCost(data, p, weight_delta, qty_delta)) {
                                    throw '';
                                }
                            }
                        }, this);
                        committed = true;

                        // create inventory commitment records
                        var rc = committed ? this.updateInventory(data) : true;
                        if (!rc) throw '';

                        if (modified || pendingCommit) {
                            if (data.id && data.id.length > 0) {
                                if (!this.updateGR(data, true)) throw '';
                                updated = true;
                            }
                            else {
                                if (!this.createGR(data, true)) throw '';
                                created = true;
                            }
                        }

                        if (!this.ProductCost.commit()) {
                            this._dbError(this.ProductCost.lastError,
                                          this.ProductCost.lastErrorString,
                                          _('Failed to commit goods received to inventory (error code %S) [message #IMS-05-13].', [this.ProductCost.lastError]));
                            throw '';
                        }

                        GeckoJS.Observer.notify(null, 'StockRecords', 'commitChanges');

                        var args = {title: _('Goods Receiving [%S] successfully updated', [data.no])};

                        if (committed) {
                            if (created) {
                                args.title = _('Goods Receiving [%S] successfully created and committed', [data.no]);
                            }
                            else if (updated) {
                                args.title = _('New Goods Receiving [%S] successfully updated and committed', [data.no]);
                            }
                            else {
                                args.title = _('Goods Receiving [%S] successfully committed', [data.no]);
                            }
                        }

                        // rebuild supplier filter menu if new GR has been created
                        if (created) this.buildSupplierFilterMenu();

                        this._gr = data;

                        // prompt to close PO and/or GR
                        args.closePO = data.po_open > 0;
                        args.closeGR = data.open > 0;

                        if (args.closePO || args.closeGR) {
                            // prompt to close PO and/or GR
                            $.popupPanel('promptClosePOGRPanel', args);
                        }
                        else {
                            // switch to editMode
                            this.editMode(this._gr);

                            GREUtils.Dialog.alert(this.topmostWindow, _('Goods Receiving Committed'), args.title);
                        }
                    }
                    catch(e) {
                        this.ProductCost.rollback();
                    }
                }
            }
        },

        updateInventory: function(gr) {
            var commitmentID = GeckoJS.String.uuid();

            // insert inventory commitment record
            if (!this.InventoryCommitment.set({
                    id: commitmentID,
                    type: 'procure',
                    memo: gr.no,
                    supplier: gr.supplier,
                    clerk: this._user
                })) {
                this._dbError(this.InventoryCommitment.lastError,
                              this.InventoryCommitment.lastErrorString,
                              _('An error was encountered while saving stock adjustment records (error code %S) [message #IMS-05-14].', [this.InventoryCommitment.lastError]));
                return false;
            }

            // insert stock records
            var producstById = GeckoJS.Session.get('productsById');
            var barcodeIndexes = GeckoJS.Session.get('barcodesIndexes');

            for (var i = 0; i < this._detailList.length; i++) {
                var item = this._detailList[i];
                
                if (item.pending) {
                    // retrieve existing stock record
                    var stockRecord = this.StockRecord.findById(item.no);
                    var lastQty = isNaN(item.last_qty) ? 0 : item.last_qty;
                    var stockDelta = parseFloat(item.commit_qty - lastQty);

                    // prepare stock record
                    if (stockRecord) {
                        stockRecord.quantity += stockDelta;
                        stockRecord.warehouse = this._branchId;
                    }
                    else {
                        var pid = barcodeIndexes[item.no];
                        var prod = producstById[pid];

                        stockRecord = {
                            id: item.no,
                            barcode: prod.barcode,
                            warehouse: this._branchId,
                            quantity: stockDelta,
                            delta: stockDelta
                        };
                    }
                    this.StockRecord.id = stockRecord.id;
                    if (!this.StockRecord.save(stockRecord)) {
                        this._dbError(this.StockRecord.lastError,
                                      this.StockRecord.lastErrorString,
                                      _('An error was encountered while saving stock records (error code %S) [message #IMS-05-15].', [this.StockRecord.lastError]));
                        return false;
                    }

                    // if price has changed, then need to return previous batch
                    var inventoryDelta = (lastQty > 0 && item.last_price != item.commit_price) ? item.commit_qty : stockDelta;

                    // prepare inventory record
                    this.InventoryRecord.id = '';
                    if (!this.InventoryRecord.save({commitment_id: commitmentID,
                                                    product_no: stockRecord.id,
                                                    barcode: stockRecord.barcode,
                                                    warehouse: stockRecord.warehouse,
                                                    value: inventoryDelta,
                                                    price: item.commit_price,
                                                    memo: '',
                                                    delta: inventoryDelta})) {
                        this._dbError(this.InventoryRecord.lastError,
                                      this.InventoryRecord.lastErrorString,
                                      _('An error was encountered while saving stock adjustment details (error code %S) [message #IMS-05-16].', [this.InventoryRecord.lastError]));
                        return false;
                    }

                    // need to return inventory?
                    if (inventoryDelta != stockDelta) {
                        this.InventoryRecord.id = '';
                        if (!this.InventoryRecord.save({commitment_id: commitmentID,
                                                        product_no: stockRecord.id,
                                                        barcode: stockRecord.barcode,
                                                        warehouse: stockRecord.warehouse,
                                                        value: -item.last_qty,
                                                        price: item.last_price,
                                                        memo: _('Price Change'),
                                                        delta: -item.last_qty
                                                        })) {
                            this._dbError(this.InventoryRecord.lastError,
                                          this.InventoryRecord.lastErrorString,
                                          _('An error was encountered while saving stock adjustment details (error code %S) [message #IMS-05-17].', [this.InventoryRecord.lastError]));
                            return false;
                        }
                    }
                }
            };
            
            return true;
        },

        closePOGR: function(target) {

            // close PO and/or GR?
            if (target == 1 || target == 3) {
                // po
                if (!this.PO.closeByNumber(this._gr.po_no)) {
                    this._dbError(this.PO.lastError,
                                  this.PO.lastErrorString,
                                  _('An error was encountered while closing purchase order (error code %S) [message #IMS-05-18].', [this.PO.lastError]));
                    return;
                }
                this._gr.po_open = 0;
            }
            if (target == 2 || target == 3) {
                //gr
                if (!this.GR.closeByNumber(this._gr.no)) {
                    this._dbError(this.GR.lastError,
                                  this.GR.lastErrorString,
                                  _('An error was encountered while closing goods receiving (error code %S) [message #IMS-05-19].', [this.GR.lastError]));
                    return;
                }
                this._gr.open = 0;
                this._gr.status = _('(ims)GR Status Closed');
            }

            // switch to editMode
            this.editMode(this._gr);

            // hide
            $.hidePanel('promptClosePOGRPanel', false)
        },

        updateLastCost: function(gr, item, weight_delta, qty_delta) {

            var doRemove = false;

            if (qty_delta != 0 || weight_delta != 0) {
                var priceRecord = this.ProductCost.getProductCosts(item.no);
                if (priceRecord === false) {
                    this._dbError(this.ProductCost.lastError,
                                  this.ProductCost.lastErrorString,
                                  _('An error was encountered while retrieving costs for product [%S (%S)] from database (error code %S) [message #IMS-05-20].',
                                    [item.name, item.no, this.ProductCost.lastError]));
                    return false;
                }

                if (!priceRecord) {
                    priceRecord = {
                        id: item.no,
                        avg_cost: item.price,
                        last_cost: item.price,
                        acc_qty: qty_delta,
                        last_gr_no: gr.no
                    };
                }
                else {
                    // update average price
                    var newWeight = parseFloat(priceRecord.avg_cost * priceRecord.acc_qty) + weight_delta;
                    var newQty = parseFloat(priceRecord.acc_qty) + parseFloat(qty_delta);

                    priceRecord.avg_cost = (newQty != 0) ? (newWeight / newQty) : 0;
                    priceRecord.acc_qty = newQty;

                    if (item.qty > 0) {
                        priceRecord.last_cost = item.price;
                        priceRecord.last_gr_no = gr.no;
                    }
                    else {
                        // look for last price, if none, remove record
                        var lastPriceRecord = this.GRDetail.find('first', {
                            conditions: 'GR_details.no = "' + item.no + '" AND GR_details.commit_date NOT NULL AND GR_details.id != "' + item.id + '"',
                            recursive: 1,
                            limit: this._pricesToShow,
                            order: 'GR_details.commit_date DESC'
                        });
                        if (lastPriceRecord) {
                            priceRecord.last_cost = lastPriceRecord.price;
                            priceRecord.last_gr_no = lastPriceRecord.GR.no;
                        }
                        else
                            doRemove = true;
                    }
                }

                this.ProductCost.id = priceRecord.id;
                if (doRemove) {
                    if (this.ProductCost.del()) {
                        this._dbError(this.ProductCost.lastError,
                                      this.ProductCost.lastErrorString,
                                      _('Failed to clear costs for product [%S (%S)] from database (error code %S) [message #IMS-05-21].',
                                        [item.name, item.no, this.ProductCost.lastError]));
                        return false;
                    }
                }
                else {
                    if (!this.ProductCost.save(priceRecord)) {
                        this._dbError(this.ProductCost.lastError,
                                      this.ProductCost.lastErrorString,
                                      _('Failed to update costs for product [%S (%S)] (error code %S) [message #IMS-05-22].',
                                        [item.name, item.no, this.ProductCost.lastError]));
                        return false;
                    }
                }
            }
            return true;
        },

        formatItem: function(item) {
            item.total_display = this.Utility.formatPrice(item.total);
            item.price_display = this.Utility.formatPrice(item.price);
            if (item.unit == 'unit') item.unit_display = _('(ims)unit');
            else item.unit_display = item.unit;

            return item;
        },

        editMode: function(gr) {
            var grListObj = this.getGRListObj();
            if (!gr) {
                var selectedIndex = grListObj.selectedIndex;
                gr = this._grList[selectedIndex];
            }

            // load PO status
            var po = this.PO.findByIndex('first', {
                index: 'no',
                value: gr.po_no,
                recursive: 0
            });
            
            gr.po_open = po ? po.open : 0;
            this._gr = gr;

            // load GR details
            this._detailList = [];
            var detailList;
            if (gr.id != null && gr.id.length > 0) {
                detailList = this.GRDetail.findByIndex('all', {
                    index: 'gr_id',
                    value: gr.id,
                    order: 'seq ASC'
                });

                if (detailList === false) {
                    this._dbError(this.GRDetail.lastError,
                                  this.GRDetail.lastErrorString,
                                  _('An error was encountered while retrieving goods receiving detail from database (error code %S) [message #IMS-05-23].'));
                    return;
                }
                this._detailList = detailList;
            }

            // save a copy of GR details
            this._savedDetailList = [];

            // post process GR details
            this._detailList.forEach(function(p) {
                this._savedDetailList.push({
                    seq: p.seq,
                    no: p.no,
                    name: p.name,
                    qty: p.qty,
                    price: p.price,
                    total: p.total
                });
                this.formatItem(p);

                // mark entry as pending if need to commit
                p.pending = (p.commit_price != p.price || p.commit_qty != p.qty);
            }, this)

            // populate form with GR data
            GeckoJS.FormHelper.unserializeFromObject('editForm', gr);
            
            // update detail list
            var detailListObj = this.getDetailListObj();
            detailListObj.datasource = this._detailList;
            this.selectItem();

            // clear GR list selection
            grListObj.selection.clearSelection();
            
            document.getElementById('create_gr').hidden = true;
            document.getElementById('cancel_create').hidden = true;
            document.getElementById('save_changes').hidden = false;
            document.getElementById('discard_changes').hidden = false;
            document.getElementById('print_gr').hidden = false;

            this._mode = document.getElementById('main_tabs').selectedIndex = 1;

            this.validateSaveDiscard();
        },

        createItem: function(pid, qty, price, total, scope) {
            var productsById = GeckoJS.Session.get('productsById');
            var prod = productsById[pid];
            if (prod) {

                var count = scope._detailList.length;

                // append to detailList
                var item = {
                    pending: true,
                    id: GeckoJS.String.uuid(),
                    gr_id: scope._gr.id,
                    seq: 1 + count,
                    no: prod.no,
                    name: prod.name,
                    price: price,
                    qty: qty,
                    order_qty: qty,
                    unit: prod.stock_unit,
                    total: total,
                    clerk: scope._user,
                    clerk_name: scope._username
                }

                scope.formatItem(item);

                scope._detailList.push(item);
                scope.getDetailListObj().treeBoxObject.rowCountChanged(1, 1);

                scope.getDetailListObj().selection.select(count);

                scope.updateGRTotal();
                scope.validateSaveDiscard();
            }
        },

        addItem: function () {

            var item = null;

            var aURL = 'chrome://viviecr/content/plusearch.xul';
            var aName = _('Product Search');
            var aFeatures = 'chrome,dialog,modal,centerscreen,dependent=yes,resize=no,width=' + this.screenwidth + ',height=' + this.screenheight;
            var aArguments = {
                buffer: '',
                item: item,
                select: true,
                showLastPrices: true,
                moreCB: this.createItem,
                scope: this
            };

            GREUtils.Dialog.openWindow(this.topmostWindow, aURL, aName, aFeatures, aArguments);
            if (aArguments.ok) {
                if (aArguments.item) {
                    let pid = aArguments.item.id;
                    if (pid) {
                        this.createItem(pid, aArguments.qty, aArguments.price, aArguments.cost, this);
                    }
                }
            }
        },

        selectItem: function() {
            var detailListObj = this.getDetailListObj();
            var selectedItems = detailListObj.selectedItems;

            if (selectedItems.length > 0) {
                this.updateItemForm(this._detailList[selectedItems[0]]);

                document.getElementById('item-qty').removeAttribute('disabled');
                document.getElementById('item-price').removeAttribute('disabled');
                document.getElementById('item-cost').removeAttribute('disabled');

                document.getElementById('modify-item').removeAttribute('disabled');
            }
            else {
                this.updateItemForm();
                
                document.getElementById('item-qty').setAttribute('disabled', true);
                document.getElementById('item-price').setAttribute('disabled', true);
                document.getElementById('item-cost').setAttribute('disabled', true);

                document.getElementById('modify-item').setAttribute('disabled', true);
            }
        },

        updateItemForm: function(item) {
            if (item) {
                GeckoJS.FormHelper.unserializeFromObject('itemForm', item);
            }
            else {
                GeckoJS.FormHelper.reset('itemForm');
            }
        },

        removeItem: function () {
            var detailListObj = this.getDetailListObj();
            var selectedItems = detailListObj.selectedItems;

            if (selectedItems.length > 0) {
                var selectedIndex = selectedItems[0];
                var item = this._detailList[selectedIndex];
                // remove only if not committed
                if (item.commit_date != null && item.commit_date != '') {
                    // committed
                    if (GREUtils.Dialog.confirm(this.topmostWindow, _('Remove Committed GR'),
                                                                    _('The selected entry has been committed to inventory. Are you sure you want to remove it by changing its quantity to 0?'))) {
                        item.qty = 0;
                        this.modifyItem(item);
                        this.selectItem();
                    }
                }
                else {
                    this._detailList.splice(selectedIndex, 1);

                    // update seq count
                    for (var i = selectedIndex; i < this._detailList.length; i++) {
                        this._detailList[i].seq--;
                    }

                    detailListObj.treeBoxObject.rowCountChanged(this._detailList.length, -1);

                    if (selectedIndex >= this._detailList.length) {
                        selectedIndex = this._detailList.length - 1;
                    }
                    if (selectedIndex > -1) {
                        detailListObj.selection.select(selectedIndex);
                    }
                    else {
                        detailListObj.selection.clearSelection();
                    }
                    detailListObj.refresh();

                    this.selectItem();

                    this.updateGRTotal();
                    this.validateSaveDiscard();
                }
            }
        },

        moveItem: function(delta) {
            var detailListObj = this.getDetailListObj();
            var selectedItems = detailListObj.selectedItems;

            if (selectedItems.length > 0) {
                var selectedIndex = selectedItems[0];
                var targetIndex = selectedIndex + delta;
                if (targetIndex >= this._detailList.length) targetIndex = this._detailList.length - 1;
                if (targetIndex < 0) targetIndex = 0;

                if (targetIndex != selectedIndex) {
                    var selectedItem = this._detailList[selectedIndex];
                    
                    this._detailList[selectedIndex] = this._detailList[targetIndex];
                    this._detailList[selectedIndex].seq = selectedIndex + 1;

                    this._detailList[targetIndex] = selectedItem;
                    selectedItem.seq = targetIndex + 1;

                    detailListObj.selection.select(targetIndex);
                    detailListObj.refresh();
                    
                    this.validateSaveDiscard();
                }
            }
        },

        modifyItem: function(data) {
            var form = data || GeckoJS.FormHelper.serializeToObject('itemForm');
            var item = this.getSelectedItem();

            if (item) {
                item.qty = form.qty;
                item.price = form.price;
                item.total = form.total;

                this.formatItem(item);

                item.pending = (item.commit_price != item.price || item.commit_qty != item.qty);

                item.clerk = this._user;
                item.clerk_name = this._username;
                
                this.getDetailListObj().refresh();

                this.updateGRTotal();
                this.validateSaveDiscard();
            }
        },

        updateGRTotal: function() {
            var total = 0;
            this._detailList.forEach(function(p) {
                total += parseFloat(p.total);
            })

            document.getElementById('editForm_total').value = total;
            document.getElementById('editForm_total').value = total;
            document.getElementById('editForm_total_display').value = this.Utility.formatPrice(total);
        },

        isGRModified: function() {
            var grForm = GeckoJS.FormHelper.serializeToObject('editForm');

            if (grForm.id == null || grForm.id == '') {
                return true;
            }
            
            // check GR
            for (var i = 0; i < this._grAttrs.length; i++) {
                var attr = this._grAttrs[i];
                if (grForm[attr] != this._gr[attr]) {
                    return true;
                }
            }

            // check GR items
            if (this._detailList.length != this._savedDetailList.length) {
                return true;
            }

            var newList = this._detailList;
            var oldList = this._savedDetailList;

            for (var i = 0; i < newList.length; i++) {
                for (var j = 0; j < this._itemAttrs.length; j++) {
                    let attr = this._itemAttrs[j];
                    if (newList[i][attr] != oldList[i][attr]) {
                        return true;
                    }
                }
            }
            return false;
        },

        isGRPendingCommit: function() {
            for (var i = 0; i < this._detailList.length; i++) {
                if (this._detailList[i].pending) return true;
            }

            return false;
        },
        
        getSelectedItem: function() {
            var detailListObj = this.getDetailListObj();
            var selectedItems = detailListObj.selectedItems;
            var selectedItem;

            if (selectedItems.length > 0) {
                var selectedIndex = selectedItems[0];
                if (this._detailList) selectedItem = this._detailList[selectedIndex];
            }
            return selectedItem;
        },

        confirmDiscardChanges: function() {
            if (this._gr && this._gr.id != '') {
                return !this.isGRModified() ||
                       GREUtils.Dialog.confirm(this.topmostWindow, _('Discard GR Changes'),
                                                                   _('Are you sure you want to discard changes made to this GR?'));
            }
            else {
                return GREUtils.Dialog.confirm(this.topmostWindow, _('Discard New GR'),
                                                                   _('Are you sure you want to discard this GR?'));
            }
        },

        discardChanges: function() {
            if (this.confirmDiscardChanges()) {
                this.editMode(this._gr);
            }
        },


        cancelCreate: function() {
            if (this.confirmDiscardChanges()) {
                this._mode = 0;
                this.searchMode();
            }
        },
        
        exit: function() {
            if (this.confirmDiscardChanges()) {
                doOKButton();
            }
        },

        validateItemForm: function(field) {
            var qty = parseFloat(document.getElementById('item-qty').value);
            var price = parseFloat(document.getElementById('item-price').value);
            var cost = parseFloat(document.getElementById('item-cost').value);
            var precision = this._precision;

            switch(field) {
                case 'qty':
                case 'price':
                    cost = qty * price, precision;
                    document.getElementById('item-cost').value = cost;
                    break;

                case 'cost':
                    if (qty > 0) {
                        price = Math.round(cost / qty, precision);
                        document.getElementById('item-price').value = price;
                    }
            }
        },

        validateSaveDiscard: function() {
            var grModified = false;

            if (this.isGRModified()) {
                grModified = true;
                document.getElementById('tab_search').setAttribute('disabled', true);
                document.getElementById('print_gr').setAttribute('disabled', true);
                document.getElementById('save_changes').removeAttribute('disabled');
                document.getElementById('discard_changes').removeAttribute('disabled');
            }
            else {
                document.getElementById('tab_search').removeAttribute('disabled');
                document.getElementById('print_gr').removeAttribute('disabled');
                document.getElementById('save_changes').setAttribute('disabled', true);
                document.getElementById('discard_changes').setAttribute('disabled', true);
            }

            if (this.isGRPendingCommit()) {
                document.getElementById('commit').hidden = false;
                document.getElementById('close').hidden = true;
                if (grModified) {
                    if (this._gr && this._gr.id != '')
                        document.getElementById('commit').setAttribute('label', _('Save & Commit'));
                    else
                        document.getElementById('commit').setAttribute('label', _('Create & Commit'));
                }
                else {
                    document.getElementById('commit').setAttribute('label', _('Commit'));
                }
            }
            else {
                document.getElementById('commit').hidden = true;
                document.getElementById('close').hidden = (this._gr.open == 0 && this._gr.po_open == 0);
            }
        },

        validateForm: function() {
            if (this._mode == 0) {
                // search mode
                var selectedIndex = this.getGRListObj().selectedIndex;
                var deleteBtnObj = document.getElementById('search_delete_gr');
                var editTabObj = document.getElementById('tab_detail');
                
                // delete button
                if (selectedIndex > -1 && !this._grList[selectedIndex].locked) {
                    deleteBtnObj.removeAttribute('disabled');
                }
                else {
                    deleteBtnObj.setAttribute('disabled', 'true');
                }

                // purchase order tab
                if (selectedIndex > -1) {
                    editTabObj.removeAttribute('disabled');
                }
                else {
                    editTabObj.setAttribute('disabled', 'true');
                }
            }
            else {

            }
        },

        openPreviewDialog: function() {

            var gr = GREUtils.extend({}, this._gr);
            var grDetail = GREUtils.extend({}, this._detailList);
            var supplier = this.getSupplierByCode(gr.supplier_code);
            var args = {gr: gr, detail: grDetail, supplier: supplier};
            
            var url = "chrome://ims/content/reports/preview_goods_receiving.xul";
            var name = "";
            var features = "chrome,titlebar,toolbar,centerscreen,modal,width=" + this.screenwidth + ",height=" + this.screenheight;
            window.openDialog(url, name, features, args);
            
        },

        _dbError: function(errno, errstr, errmsg) {
            this.log('ERROR', errmsg + '\nDatabase Error [' +  errno + ']: [' + errstr + ']');
            GREUtils.Dialog.alert(this.topmostWindow,
                                  _('Data Operation Error'),
                                  errmsg + '\n\n' + _('Please restart the machine, and if the problem persists, please contact technical support immediately.'));
        }
    };

    GeckoJS.Controller.extend(__controller__);
    
})();

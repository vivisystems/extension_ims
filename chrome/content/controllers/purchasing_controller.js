(function(){

    var __controller__ = {

        name: 'Purchasing',

        uses: ['PO', 'PODetail', 'StockRecord', 'ProductCost', 'Supplier'],

        components: ['Utility'],
        
        screenwidth: GeckoJS.Configure.read('vivipos.fec.mainscreen.width') || 800,
        screenheight: GeckoJS.Configure.read('vivipos.fec.mainscreen.height') || 600,

        _po: null,
        _poListObj: null,
        _poList: [],
        _detailListObj: null,
        _detailList: [],
        _mode: 0,
        _supplierFilter: [],
        _suppliers: [],
        _terminal: GeckoJS.Session.get('terminal_no'),
        _user: _('unknown user'),
        _username: _('unknown username'),
        _precision: GeckoJS.Configure.read('vivipos.fec.settings.PrecisionPrices') || 0,
        _poAttrs: ['id',
                   'no',
                   'desc',
                   'supplier_index',
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

                var clerk;
                if (this.Acl) {
                    clerk = this.Acl.getUserPrincipal();
                    if (clerk) {
                        this._user = clerk.username;
                        this._username = clerk.description || clerk.username;
                    }
                }

                // load suppliers
                this.loadSuppliers();

                // initialize supplier menus
                this.buildSupplierFilterMenu();
                this.buildSupplierEditMenu();

                // set search date range to last week
                var now = Date.today();
                var lastWeek = Date.today().addMonths(-1);
                this.setSearchDateRange(lastWeek, now);

                // count total number of POs
                this.updatePOCountDisplay(null, null, this.countAllPOs());

                // force search mode
                this.searchMode();
            }
            else {
                this.displayNoAccessMessage();
            }
        },

        displayNoAccessMessage: function() {
            var serverName = this.StockRecord.getHostname();
            GREUtils.Dialog.alert(this.topmostWindow, _('Access to Purchase Orders Not Available'),
                                                      _('Purchase Orders may only be managed from the designated Stock Control Service Master at [%S]', [serverName]));
            window.close();
        },

        isStockControlServer: function() {
            return !this.StockRecord.isRemoteService();
        },

        loadSuppliers: function() {
            var fields = ['code', 'name', 'name || " (" || code || ")" AS supplier'];
            var orderBy = 'name ASC, code';
            var suppliers = this.Supplier.find('all', {
                fields: fields,
                order: orderBy
            });

            if (!suppliers) {
                this.log('ERROR', 'Failed to retrieve suppliers from database');
                suppliers = [];
            }

            this._suppliers = suppliers;
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
            
            // search for POs
            this.updatePOList();
        },

        countAllPOs: function() {
            var count = this.PO.findCount();

            if (isNaN(parseInt(count))) {
                this.log('ERROR', 'Failed to retrieve PO count');
                count = 0;
            }

            return count;
        },

        getPOListObj: function() {
            if (!this._poListObj) {
                this._poListObj = document.getElementById('poscrollabletree');
            }
            return this._poListObj;
        },

        getDetailListObj: function() {
            if (!this._detailListObj) {
                this._detailListObj = document.getElementById('detailscrollabletree');
            }
            return this._detailListObj;
        },

        buildSupplierFilterMenu: function() {

            // build supplier filter menu
            var supplierFilter = this.PO.findSuppliers();

            if (!supplierFilter) {
                this.log('ERROR', 'Failed to retrieve list of suppliers from database');
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

                this._supplierFilter = supplierFilter;
            }
        },

        buildSupplierEditMenu: function() {

            // build PO supplier menu
            var editMenuObj = document.getElementById('editForm_supplier');
            while (editMenuObj.itemCount > 0) {
                editMenuObj.removeItemAt(0);
            }
            this._suppliers.forEach(function(s, index) {
                editMenuObj.appendItem(s.name + ' (' + s.code + ')', index, '');
            });
        },

        setSearchDateRange: function(startDate, endDate) {
            var startDateObj = document.getElementById('filter_startdate');
            var endDateObj = document.getElementById('filter_enddate');
            
            endDateObj.value = endDate.getTime();
            startDateObj.value = startDate.getTime();
        },

        queryPOList: function() {
            
            var startTimestamp = parseInt(document.getElementById('filter_startdate').value);
            var endTimestamp = parseInt(document.getElementById('filter_enddate').value);
            var poNumber = document.getElementById('filter_po_number').value || '';
            var supplierIndex = parseInt(document.getElementById('filter_supplier').value);
            var status = parseInt(document.getElementById('filter_status').value);
            var goodsReceived = parseInt(document.getElementById('filter_goods_received').value);
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
            var poList = this.PO.findPOList(startTimestamp, endTimestamp, poNumber, supplierCode, supplierName, status, startIndex, limit);
            var outList = [];

            if (!poList) {
                this.log('ERROR', 'Failed to fetch POs from database');
            }
            else {
                if (isNaN(goodsReceived)) goodsReceived = -1;

                poList.list.forEach(function(po, index) {
                    po.status = po.open ? _('(spims)PO Status Open') : _('(spims)PO Status Closed');
                    po.created_date = new Date(po.created * 1000).toLocaleDateString();
                    po.supplier = po.supplier_name + ' (' + po.supplier_code + ')';
                    po.total_display = this.Utility.formatPrice(po.total);

                    // any GR associated with this PO?
                    let grRecords = this.PO.findGoodsReceiving(po.id);
                    po.locked = grRecords.length > 0;

                    // filter by goods received
                    if (goodsReceived == -1 || (goodsReceived == 1 && po.locked) || (goodsReceived == 0 && !po.locked)) {
                        outList.push(po);
                    }
                }, this)
            }
            poList.list = outList;
            
            return poList;
        },

        updatePOCountDisplay: function(shown, found, total) {
            if (shown != null) document.getElementById('search_result_displayed').value = shown;
            if (found != null) document.getElementById('search_result_count').value = found;
            if (total != null) document.getElementById('search_result_total').value = total;
        },

        updatePOList: function() {
            var poListObj = this.getPOListObj();
            var poList = this.queryPOList();

            // clear current selection
            poListObj.selection.clearSelection();
            poListObj.selectedIndex = -1;
            
            // set datasource to new PO list
            poListObj.datasource = this._poList = poList.list;

            this.updatePOCountDisplay(this._poList.length, poList.count, null);

            this.validateForm();
        },

        selectPO: function() {
            this.validateForm();
        },

        deletePO: function() {
            var poListObj = this.getPOListObj();
            var selectedIndex = poListObj.selectedIndex;

            if (selectedIndex > -1 && !this._poList[selectedIndex].locked) {
                var po = this._poList[selectedIndex];
                if (!GREUtils.Dialog.confirm(this.topmostWindow,
                                             _('confirm delete PO [%S]', [po.no]),
                                             _('Are you sure you want to delete PO [%S]?', [po.no]))) {
                    return;
                }

                // delete PO record
                this.PO.del(po.id, true);
                
                // update cached PO list
                this._poList.splice(selectedIndex, 1);
                poListObj.datasource = this._poList;
                
                // update selected index
                if (selectedIndex >= this._poList.length) selectedIndex--;
                poListObj.selection.select(selectedIndex);

                this.validateForm();
            }
        },

        addPO: function(clear) {
            $.popupPanel('promptAddPOPanel', {suppliers: this._suppliers,
                                              okCB: this.createMode,
                                              clear: clear,
                                              scope: this});
        },

        createMode: function(ponumber, description, supplier_code, self) {
            // check for duplicate po number
            var po = self.PO.findByIndex('first', {index: 'no', value: ponumber});
            if (po) {
                GREUtils.Dialog.alert(self.topmostWindow, _('Duplicate PO Number'),
                                                          _('PO Number [%S] already exists, please enter a different PO number.', [ponumber]))
                self.addPO(false);
                return;
            }

            var today = new Date();
            var supplier_name = '';
            var supplier = supplier_code;
            var supplier_index = -1;

            for (var i = 0; i < self._suppliers.length; i++) {
                if (self._suppliers[i].code == supplier_code) {
                    supplier_name = self._suppliers[i].name;
                    supplier = self._suppliers[i].supplier;
                    supplier_index = i;
                    break;
                }
            }

            self._po = {id: '',
                        no: ponumber,
                        desc: description || '',
                        supplier_code: supplier_code,
                        supplier_name: supplier_name,
                        supplier_index: supplier_index,
                        created_date: today.toLocaleDateString(),
                        supplier: supplier,
                        total: 0,
                        total_display: self.Utility.formatPrice(0),
                        open: 1,
                        status: _('(spims)PO Status Open'),
                        clerk: self._user,
                        clerk_name: self._username,
                        terminal: self._terminal
            };

            GeckoJS.FormHelper.unserializeFromObject('editForm', self._po);

            document.getElementById('create_po').hidden = false;
            document.getElementById('cancel_create').hidden = false;
            document.getElementById('save_changes').hidden = true;
            document.getElementById('discard_changes').hidden = true;

            document.getElementById('tab_detail').removeAttribute('disabled');
            self._mode = document.getElementById('main_tabs').selectedIndex = 1;

            // initialize detail List
            self.getDetailListObj().datasource = self._detailList = self._savedDetailList = [];
        },

        saveChanges: function() {
            var data = GeckoJS.FormHelper.serializeToObject('editForm');

            // process supplier data
            if (data.supplier_index > -1 && this._suppliers[data.supplier_index]) {
                data.supplier_code = document.getElementById('editForm_supplier_code').value = this._suppliers[data.supplier_index].code;
                data.supplier_name = document.getElementById('editForm_supplier_name').value = this._suppliers[data.supplier_index].name;
            }

            if (data.id && data.id.length > 0) {
                // update clerk & terminal
                data.clerk = this._user;
                data.clerk_name = this._username;
                data.terminal = this._terminal;

                // edit
                this.PO.id = data.id;
                this.PO.save(data);

                this.PODetail.replaceRecords(data.id, this._detailList);

                this.editMode(data);

                GREUtils.Dialog.alert(this.topmostWindow, _('Purchase Order Updated'),
                                                          _('Purchase Order [%S] successfully updated', [data.no]))
            }
            else {
                // create
                this.PO.id = data.id = GeckoJS.String.uuid();
                this.PO.save(data);

                this._detailList.forEach(function(p) {
                    p.po_id = data.id;
                })
                this.PODetail.saveAll(this._detailList);

                // switch to editMode
                this.editMode(data);

                GREUtils.Dialog.alert(this.topmostWindow, _('New Purchase Order Created'),
                                                          _('Purchase Order [%S] successfully created', [data.no]))
            }

            // rebuild supplier filter menu
            this.buildSupplierFilterMenu();
        },

        updateLastPrice: function(po, items) {
            items.forEach(function(p) {
                let priceRecord = this.ProductCost.findByIndex('first', {
                    index: 'no',
                    value: p.no
                });

                if (!priceRecord) {
                    priceRecord = {
                        id: GeckoJS.String.uuid(),
                        no: p.no,
                        avg_cost: 0,
                        last_cost: p.price,
                        manual_cost: 0,
                        last_po_no: po.no,
                        last_gr_id: ''
                    };
                }
                else {
                    priceRecord.last_cost = p.price;
                    last_po_no = po.no;
                }

                this.ProductCost.id = priceRecord.id;
                this.ProductCost.save(priceRecord);
            }, this)
        },

        formatItem: function(item) {
            item.total_display = this.Utility.formatPrice(item.total);
            item.price_display = this.Utility.formatPrice(item.price);
            if (item.unit == 'unit') item.unit_display = _('(spims)unit');
            else item.unit_display = item.unit;
        },

        editMode: function(po) {
            var poListObj = this.getPOListObj();
            if (!po) {
                var selectedIndex = poListObj.selectedIndex;
                po = this._poList[selectedIndex];
            }
            this._po = po;

            // load PO details
            this._detailList = [];
            if (po.id != null && po.id.length > 0) {
                this._detailList = this.PODetail.findByIndex('all', {
                    index: 'po_id',
                    value: po.id,
                    order: 'seq ASC'
                });
            }

            // save a copy of PO details
            this._savedDetailList = [];

            // post process PO details
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
            }, this)

            // populate form with PO data
            GeckoJS.FormHelper.unserializeFromObject('editForm', po);
            
            // check if po supplier is present in supplier list
            var supplierIndex = -1;
            for (var i = 0; i < this._suppliers.length; i++) {
                if (this._suppliers[i].code == po.supplier_code && this._suppliers[i].name == po.supplier_name) {
                    supplierIndex = i;
                    break;
                }
            }
            
            var menuObj = document.getElementById('editForm_supplier');
            if (supplierIndex == -1) {
                // update supplier menu
                var firstMenuItem = menuObj.getItemAtIndex(0);
                if (firstMenuItem.value == '-1') {
                    menuObj.removeItemAt(0);
                }

                menuObj.insertItemAt(0, po.supplier_name + ' (' + po.supplier_code + ')', -1);
            }
            menuObj.setAttribute('default', supplierIndex);
            po.supplier_index = menuObj.value = supplierIndex;
            
            // update detail list
            var detailListObj = this.getDetailListObj();
            detailListObj.datasource = this._detailList;
            //detailListObj.selection.clearSelection();
            this.selectItem();

            // clear po list selection
            poListObj.selection.clearSelection();
            
            document.getElementById('create_po').hidden = true;
            document.getElementById('cancel_create').hidden = true;
            document.getElementById('save_changes').hidden = false;
            document.getElementById('discard_changes').hidden = false;

            this._mode = document.getElementById('main_tabs').selectedIndex = 1;

            this.validateSaveDiscard();
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
                showLastPrices: true
            };

            GREUtils.Dialog.openWindow(this.topmostWindow, aURL, aName, aFeatures, aArguments);
            if (aArguments.ok) {
                if (aArguments.item) {
                    let pid = aArguments.item.id;
                    if (pid) {
                        let productsById = GeckoJS.Session.get('productsById');
                        let prod = productsById[pid];
                        if (prod) {

                            var count = this._detailList.length;

                            // append to detailList
                            var item = {
                                id: GeckoJS.String.uuid(),
                                po_id: this._po.id,
                                seq: 1 + count,
                                no: prod.no,
                                name: prod.name,
                                price: aArguments.price,
                                qty: aArguments.qty,
                                unit: prod.stock_unit,
                                total: aArguments.cost,
                                clerk: this._user,
                                clerk_name: this._username
                            }

                            this.formatItem(item);

                            this._detailList.push(item);
                            this.getDetailListObj().treeBoxObject.rowCountChanged(1, 1);

                            this.getDetailListObj().selection.select(count);

                            this.updatePOTotal();
                            this.validateSaveDiscard();
                        }
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

                this.updatePOTotal();
                this.validateSaveDiscard();
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

        modifyItem: function() {
            var form = GeckoJS.FormHelper.serializeToObject('itemForm');
            var item = this.getSelectedItem();

            if (item) {
                item.qty = form.qty;
                item.price = form.price;
                item.total = form.total;

                this.formatItem(item);

                item.clerk = this._user;
                item.clerk_name = this._username;

                this.getDetailListObj().refresh();

                this.updatePOTotal();
                this.validateSaveDiscard();
            }
        },

        updatePOTotal: function() {
            var total = 0;
            this._detailList.forEach(function(p) {
                total += parseFloat(p.total);
            })

            document.getElementById('editForm_total').value = total;
            document.getElementById('editForm_total').value = total;
            document.getElementById('editForm_total_display').value = this.Utility.formatPrice(total);
        },

        isPOModified: function() {
            var poForm = GeckoJS.FormHelper.serializeToObject('editForm');

            if (poForm.id == null || poForm.id == '') {
                return true;
            }

            // check PO
            for (var i = 0; i < this._poAttrs.length; i++) {
                var attr = this._poAttrs[i];
                if (poForm[attr] != this._po[attr]) {
                    return true;
                }
            }

            // check PO items
            if (this._detailList.length != this._savedDetailList.length) {
                return true;
            }

            var newList = this._detailList;
            var oldList = this._savedDetailList;

            for (var i = 0; i < this._detailList.length; i++) {
                for (var j = 0; j < this._itemAttrs.length; j++) {
                    let attr = this._itemAttrs[j];
                    if (newList[i][attr] != oldList[i][attr]) {
                        return true;
                    }
                }
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
            if (this._po && this._po.id != '') {
                return !this.isPOModified() ||
                       GREUtils.Dialog.confirm(this.topmostWindow, _('Discard PO Changes'),
                                                                   _('Are you sure you want to discard changes made to this PO?'));
            }
            else {
                return GREUtils.Dialog.confirm(this.topmostWindow, _('Discard New PO'),
                                                                   _('Are you sure you want to discard this PO?'));
            }
        },

        discardChanges: function() {
            if (this.confirmDiscardChanges()) {
                this.editMode(this._po);
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
            if (this.isPOModified()) {
                document.getElementById('save_changes').removeAttribute('disabled');
                document.getElementById('discard_changes').removeAttribute('disabled');
            }
            else {
                document.getElementById('save_changes').setAttribute('disabled', true);
                document.getElementById('discard_changes').setAttribute('disabled', true);
            }
        },

        validateForm: function() {
            if (this._mode == 0) {
                // search mode
                var selectedIndex = this.getPOListObj().selectedIndex;
                var deleteBtnObj = document.getElementById('search_delete_po');
                var editTabObj = document.getElementById('tab_detail');
                
                // delete button
                if (selectedIndex > -1 && !this._poList[selectedIndex].locked) {
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
        }
    };

    GeckoJS.Controller.extend(__controller__);
    
})();

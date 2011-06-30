(function(){

    var __controller__ = {
        name: 'Suppliers',

        uses: ['Supplier'],

        _listDatas: [],
        _tabboxObj: null,
        _tabObj: null,
        _supplierTabLabel: '',
        _newIDCounter: null,
        _count:0,
        _total:0,
        _newID:'',
        _terminal: GeckoJS.Session.get('terminal_no'),
        _user: _('unknown user'),
        _username: _('unknown username'),

        load: function () {
            if (this.Acl) {
                var clerk = this.Acl.getUserPrincipal();
                if (clerk) {
                    this._user = clerk.username;
                    this._username = clerk.description || clerk.username;
                }
            }

            this._supplierTabLabel = this.getSupplierTabObj().label;

            // switch to search panel
            this.searchMode();

            // validate form to turn action buttons on/off
            this.validateForm();

            // get supplier count
            this.getSupplierCount();

            this.updateResultCount();

            //set default
            document.getElementById('search_limit_size').value = 100;
            
        },

        setSearchConditions:function(){
            var conditionInput = GeckoJS.FormHelper.serializeToObject('searchForm');

            conditionInput.code = document.getElementById('filter_supplier_code').value;
            conditionInput.name = document.getElementById('filter_name').value;
            conditionInput.status = document.getElementById('filter_active').checked;

            this.selectSupplier(-1);

            this.search(conditionInput, 'supplierscrollablepanel');
        },

        selectSupplier: function(index){
            // clear form
            GeckoJS.FormHelper.reset('supplierForm');

            this.getSupplierListObj().selection.select(index);
            if (index > -1) {
                var supplier = this._listDatas[index];

                if (!('created_on' in supplier))
                    supplier.created_on = new Date(supplier.created * 1000).toLocaleDateString();

                GeckoJS.FormHelper.unserializeFromObject('supplierForm', supplier);
            }
            else {
                GeckoJS.FormHelper.reset('supplierForm');

                this.searchMode();
            }

            this.validateForm();
        },

        search: function ( conditionInput, listID) {
            // construct search conditions
            var conditionStr = '';

            // code
            if (conditionInput.code != null && conditionInput.code != '') {
                conditionStr = 'code like \'%' + conditionInput.code.replace('\'', '\'\'', 'g') + '%\'';
            }

            // name
            if (conditionInput.name != null && conditionInput.name != '') {
                if (conditionStr != '') conditionStr += ' AND '
                conditionStr += 'name like \'%' + conditionInput.name.replace('\'', '\'\'', 'g') + '%\'';
            }

            // active
            if (conditionInput.status) {
                if (conditionStr != '') conditionStr += ' AND '
                conditionStr += 'status = 1' ;
            }
            else
            {
                if (conditionStr != '') conditionStr += ' AND '
                conditionStr += 'status = 0' ;
            }

            var suppliers = this.loadSuppliers(conditionStr, conditionInput.search_limit_start -1 , conditionInput.search_limit_size);

            document.getElementById(listID).datasource = suppliers.list;

            this.updateResultCount();
        },

        loadSuppliers: function(conditions, start, size) {
            if (start == null) {
                start = 0;
                size = 1;
            }

            var emptycondition = ' WHERE ';

            if (conditions =='') emptycondition = '';

            // load supplier data into session
            this._listDatas = this.Supplier.getDataSource().fetchAll('SELECT * FROM suppliers '+ emptycondition + conditions + ' order by created DESC LIMIT ' + start + ',' + size);
            if (this._listDatas === false) {
                this._dbError(this.Supplier.lastError,
                              this.Supplier.lastErrorString,
                              _('Failed to retrieve supplier records from database (error code %S) [message #IMS-06-01].', [this.Supplier.lastError]));
                this._listDatas = [];
            }

            this._count = this.Supplier.findCount(conditions);
            if (this.Supplier.lastError != 0) {
                this._dbError(this.Supplier.lastError,
                              this.Supplier.lastErrorString,
                              _('Failed to retrieve purchase order record count from database (error code %S) [message #IMS-06-02].', [this.Supplier.lastError]));
                this._count = 0;
            }

            if (this._listDatas == null || this._listDatas == '') this._listDatas = [];

            return {list:this._listDatas, count: this._count}
        },

        updateResultCount: function() {
            document.getElementById('search_result_displayed').value = this._listDatas.length;
            document.getElementById('search_result_count').value = this._count;
            document.getElementById('search_result_total').value = this._total;
        },

        addSupplier: function(){
            var aURL = 'chrome://viviecr/content/prompt_additem.xul';
            var screenwidth = parseInt((GeckoJS.Configure.read('vivipos.fec.mainscreen.width') || 800) * .7) || 500;
            var screenheight = parseInt((GeckoJS.Configure.read('vivipos.fec.mainscreen.height') || 600) * .85) || 500;
            var aFeatures = 'chrome,titlebar,toolbar,centerscreen,modal,width=' + screenwidth + ',height=' + screenheight;
            var inputObj = {input0:null, require0:true, input1:null, require1:true, numpad:true};

            GREUtils.Dialog.openWindow(this.topmostWindow, aURL, _('Add Supplier'), aFeatures, _('New Supplier'), '', _('Code'), _('Name'), inputObj);

            if (inputObj.ok) {
                var supplierCode = inputObj.input0;

                if (this.isDuplicate(supplierCode)) {
                    GREUtils.Dialog.alert(this.topmostWindow,
                                          _('New Supplier'),
                                          _('Supplier Code [%S] has already been assigned', [supplierCode]));
                    return;
                }

                var newSupplier = this.newSupplierRecord(supplierCode, inputObj.input1);

                this.Supplier.id = newSupplier.id = '';
                if (!this.Supplier.save(newSupplier)) {
                    this._dbError(this.Supplier.lastError,
                                  this.Supplier.lastErrorString,
                                  _('Failed to create supplier record (error code %S) [message #IMS-06-03].', [this.Supplier.lastError]));
                    return;
                }

                this._listDatas.push(newSupplier);
                this._listDatas = new GeckoJS.ArrayQuery(this._listDatas).orderBy('code asc');
                this._total++;

                this.updateResultCount();

                this.getSupplierListObj().treeBoxObject.rowCountChanged(0, 1);

                // make sure row is visible
                this.getSupplierListObj().treeBoxObject.ensureRowIsVisible(0);

                //search newSupplier
                this.searchNewSupplier(supplierCode);

                // select the new supplier
                this.selectSupplier(0);

                // switch to edit mode
                this.editMode();
            }
        },

        isDuplicate: function(supplier_code) {
            var supplier = this.Supplier.findByIndex('first', {
                index: 'code',
                value: supplier_code
            });

            if (supplier === false) {
                this._dbError(this.Supplier.lastError,
                              this.Supplier.lastErrorString,
                              _('An error was encountered while validating supplier code (error code %S) [message #IMS-06-04].', [this.Supplier.lastError]));
                return true;
            }

            return (supplier != null);
        },

        newSupplierRecord: function(supplier_code, name) {
            return {
                code: supplier_code,
                name: name,
                status: true,
                clerk: this._user,
                clerk_name: this._username,
                terminal: this._terminal
            }
        },

        searchNewSupplier: function(supplier_code){
            GeckoJS.FormHelper.reset('searchForm');
            document.getElementById('filter_supplier_code').value = supplier_code;

            this.setSearchConditions();
        },

        modifySupplier: function(){
            var index = this.getSupplierListObj().selectedIndex;
            var modifiedSupplier = GeckoJS.FormHelper.serializeToObject('supplierForm');
            if (index > -1 && modifiedSupplier.code != '' && modifiedSupplier.name != '') {

                this.Supplier.id = modifiedSupplier.id;
                if (!this.Supplier.save(modifiedSupplier)) {
                    this._dbError(this.Supplier.lastError,
                                  this.Supplier.lastErrorString,
                                  _('An error was encountered while modifying supplier code (error code %S) [message #IMS-06-05].', [this.Supplier.lastError]));
                    return;
                }

                this._listDatas[index] = modifiedSupplier;
                this._listDatas = new GeckoJS.ArrayQuery(this._listDatas).orderBy('code asc');

                // loop through this._listDatas to find the newly modified destination
                var newIndex;
                for (newIndex = 0; newIndex < this._listDatas.length; newIndex++) {
                    if (this._listDatas[newIndex].id == modifiedSupplier.id) {
                        break;
                    }
                }
                this.getSupplierListObj().treeBoxObject.invalidate();

                // make sure row is visible
                this.getSupplierListObj().treeBoxObject.ensureRowIsVisible(newIndex);

                // select the new supplier
                this.editMode();
                this.selectSupplier(newIndex);

                OsdUtils.info(_('Supplier [%S (%S)] modified successfully', [modifiedSupplier.name, modifiedSupplier.code]));
            }
        },

        suspendSupplier: function() {
            var selectedIndex = this.getSupplierListObj().selectedIndex;
            var supplier = this._listDatas[selectedIndex];

            if (supplier) {
                supplier.status = !supplier.status;

                this.Supplier.id = supplier.id
                if (!this.Supplier.save(supplier)) {
                    this._dbError(this.Supplier.lastError,
                                  this.Supplier.lastErrorString,
                                  _('An error was encountered while updating supplier status (error code %S) [message #IMS-06-06].', [this.Supplier.lastError]));
                    return;
                }

                this._listDatas[selectedIndex].status = supplier.status;

                // store into form
                document.getElementById('supplier_active').checked = supplier.status;

                this.getSupplierListObj().treeBoxObject.invalidate(selectedIndex);

                // make sure row is visible
                this.getSupplierListObj().treeBoxObject.ensureRowIsVisible(selectedIndex);

                this.selectSupplier(selectedIndex);

                this.validateForm();

                if (supplier.active)
                    OsdUtils.info(_('Supplier [%S (%S)] activated successfully', [supplier.name, supplier.code]));
                else
                    OsdUtils.info(_('Supplier [%S (%S)] suspended successfully', [supplier.name, supplier.code]));
            }
        },

        setMode: function() {
            var index = this.getTabboxObj().selectedIndex;
            if (index == 0) {
                this.searchMode();
            }
            else if (index == 1) {
                this.editMode();
            }
        },

        isSearchMode: function() {
            return this._mode == 2;
        },

        isEditMode: function() {
            return this._mode == 3;
        },

        searchMode: function() {
            if (!this.confirmChangeSupplier()) {
                this.editMode();
                return;
            }

            if (this.getTabboxObj().selectedIndex != 0) {
                document.getElementById('main-tabbox').selectedIndex = 0;
            }
            this._mode = 2;

            this.getSupplierTabObj().setAttribute('label', this._supplierTabLabel);
            this.validateForm();
        },

        editMode: function() {
            if (this.getTabboxObj().selectedIndex != 1) {
                document.getElementById('main-tabbox').selectedIndex = 1;
            }
            this._mode = 3;

            // set tab label to include supplier id
            var selectedIndex = this.getSupplierListObj().selectedIndex;
            var supplier;
            if (selectedIndex > -1) {
                supplier = this._listDatas[selectedIndex];

                this.getSupplierTabObj().setAttribute('label', supplier.code  + ' [' + supplier.name + ']');

            }

            this.validateForm();
        },

        discardChanges: function() {
            var selectedIndex = this.getSupplierListObj().selectedIndex;
            if (selectedIndex > -1) {
                GeckoJS.FormHelper.unserializeFromObject('supplierForm', this._listDatas[selectedIndex]);

                this.validateForm();
            }
        },
        
        validateForm: function() {
            var supplierTab = document.getElementById('tab_supplier');
            var searchTab = document.getElementById('tab_search');
            var selectedItems = this.getSupplierListObj().selectedItems;
            var selectedCount = selectedItems ? selectedItems.length : 0;
            var supplier = {};
            var suspendBtn = document.getElementById('search_suspend_supplier');

            if (this.isSearchMode()) {

                if (selectedCount > 0) {
                    supplier = this._listDatas[selectedItems[0]];
                    supplierTab.removeAttribute('disabled');
                }
                else {
                    supplierTab.setAttribute('disabled', true);
                }
                
                // suspend label
                if (selectedCount == 0) {
                    suspendBtn.label = _('Suspend');
                }
                else {
                    if (supplier.status) {
                        suspendBtn.label = _('Suspend');
                    }
                    else {
                        suspendBtn.label = _('Activate');
                    }
                }

                suspendBtn.setAttribute('disabled', (selectedCount == 0));
            }
            else if (this.isEditMode()) {
                var nameText = GeckoJS.String.trim(document.getElementById('supplier_name').value);
                var modifyBtn = document.getElementById('edit_modify_supplier');
                var discardBtn = document.getElementById('edit_discard_changes');

                supplierTab.removeAttribute('disabled');

                if (selectedCount > 0) {
                    supplier = this._listDatas[selectedItems[0]];
                }

                modifyBtn.setAttribute('disabled', nameText == '');

                // suspend label
                if (supplier.status) {
                    suspendBtn.label = _('Suspend');
                }
                else {
                    suspendBtn.label = _('Activate');
                }

                // search tab
                if (GeckoJS.FormHelper.isFormModified('supplierForm')) {
                    searchTab.setAttribute('disabled', true);
                    discardBtn.removeAttribute('disabled');
                }
                else {
                    searchTab.removeAttribute('disabled');
                    discardBtn.setAttribute('disabled', true);
                }
            }
        },

        getSupplierListObj: function() {
            if(this._listObj == null) {
                this._listObj = document.getElementById('supplierscrollablepanel');
            }
            return this._listObj;
        },

         getSupplierTabObj: function() {
            if(this._tabObj == null) {
                this._tabObj = document.getElementById('tab_supplier');
            }
            return this._tabObj;
        },

        getTabboxObj: function() {
            if(this._tabboxObj == null) {
                this._tabboxObj = document.getElementById('main-tabbox');
            }
            return this._tabboxObj;
        },

        getSupplierCount: function(){
            this._total = this.Supplier.findCount();
            if (this.Supplier.lastError != 0) {
                this._dbError(this.Supplier.lastError,
                              this.Supplier.lastErrorString,
                              _('An error was encountered while retrieving supplier count (error code %S) [message #IMS-06-06].', [this.Supplier.lastError]));
                this._total = 0;
            }
            return this._total;
        },

        confirmChangeSupplier: function() {
            if (this.isEditMode()) {
                if (GeckoJS.FormHelper.isFormModified('supplierForm')) {
                    if (!GREUtils.Dialog.confirm(this.topmostWindow,
                                                 _('Discard Changes'),
                                                 _('You have made changes to the current supplier. Are you sure you want to discard the changes?'))) {
                        return false;
                    }
                }
                // reset form
                this.selectSupplier(this.getSupplierListObj().selectedIndex);
            }
            return true;
        },

        exit: function() {
            // check if supplier form has been modified
            if (this.isEditMode() && GeckoJS.FormHelper.isFormModified('supplierForm')) {
                var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                        .getService(Components.interfaces.nsIPromptService);
                var check = {data: false};
                var flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_IS_STRING +
                            prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_CANCEL +
                            prompts.BUTTON_POS_2 * prompts.BUTTON_TITLE_IS_STRING;

                var action = prompts.confirmEx(this.topmostWindow,
                                               _('Exit'),
                                               _('You have made changes to the current supplier. Save changes before exiting?'),
                                               flags, _('Save'), '', _('Discard'), null, check);
                if (action == 1) {
                    return;
                }
                else if (action == 0) {
                    this.modifySupplier();
                }
            }
            window.close();
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

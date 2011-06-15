(function() {

    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }
    
    var __model__ = {

        name: 'PO',

        useDbConfig: 'inventory',

        table: 'POs',

        hasMany: [{name: 'PODetail',
                   table: 'PO_details',
                   primaryKey: 'id',
                   foreignKey: 'po_id'
                  },
                  {name: 'GR',
                   table: 'GRs',
                   primaryKey: 'no',
                   foreignKey: 'po_no'
                  }],

        createStore: function() {

            var ds = this.datasource;
            
            // table POs
            var sql = 'CREATE TABLE IF NOT EXISTS "POs" \
                       ("id" VARCHAR PRIMARY KEY NOT NULL , \
                        "no" VARCHAR NOT NULL UNIQUE , \
                        "desc" TEXT, \
                        "supplier_code" VARCHAR NOT NULL , \
                        "supplier_name" VARCHAR NOT NULL , \
                        "total" FLOAT NOT NULL  DEFAULT 0, \
                        "open" INTEGER NOT NULL , \
                        "clerk" VARCHAR NOT NULL , \
                        "clerk_name" VARCHAR NOT NULL , \
                        "terminal" VARCHAR NOT NULL , \
                        "created" INTEGER NOT NULL , \
                        "modified" INTEGER NOT NULL );';
            
            ds.execute(sql, []);
            sql = 'CREATE INDEX IF NOT EXISTS "POs_supplier_code_name" ON "POs" ("supplier_code" ASC, "supplier_name" ASC);';
            ds.execute(sql, []);
            sql = 'CREATE INDEX IF NOT EXISTS "POs_open" ON "POs" ("open" ASC);';
            ds.execute(sql, []);
            sql = 'CREATE INDEX IF NOT EXISTS "POs_clerk" ON "POs" ("clerk" ASC);';
            ds.execute(sql, []);
            sql = 'CREATE INDEX IF NOT EXISTS "POs_terminal" ON "POs" ("terminal" ASC);';
            ds.execute(sql, []);
            sql = 'CREATE INDEX IF NOT EXISTS "POs_supplier_code_name" ON "POs" ("supplier_code" ASC, "supplier_name" ASC);';
            ds.execute(sql, []);
            sql = 'CREATE INDEX IF NOT EXISTS "POs_created" ON "POs" ("created" ASC);';
            ds.execute(sql, []);
            sql = 'CREATE INDEX IF NOT EXISTS "POs_modified" ON "POs" ("modified" ASC);';
            ds.execute(sql, []);
        },

        findPOList: function(startTimestamp, endTimestamp, poNumber, supplierCode, supplierName, status, startIndex, limit) {
            // validate query parameters
            var conditionStr = '';

            // start date
            if (!isNaN(startTimestamp)) {
                conditionStr = 'created >= ' + (startTimestamp / 1000);
            }

            // end date
            if (!isNaN(endTimestamp)) {
                conditionStr += (conditionStr ? ' AND ' : '') + 'created < ' + (endTimestamp / 1000);
            }

            // PO number
            poNumber = poNumber.trim();
            if (poNumber.length > 0) {
                conditionStr += (conditionStr ? ' AND ' : '') + 'no like "%' + poNumber + '%"';
            }

            // supplier code
            supplierCode = supplierCode.trim();
            if (supplierCode.length > 0) {
                conditionStr += (conditionStr ? ' AND ' : '') + 'supplier_code = "' + supplierCode + '"';
            }

            // supplier name
            supplierName = supplierName.trim();
            if (supplierName.length > 0) {
                conditionStr += (conditionStr ? ' AND ' : '') + 'supplier_name = "' + supplierName + '"';
            }

            // status
            if (!isNaN(status)) {
                conditionStr += (conditionStr ? ' AND ' : '') + 'open = ' + status;
            }

            // search limit
            if (isNaN(startIndex) || startIndex < 1) startIndex = 1;
            startIndex--;
            if (isNaN(limit) || limit < 1) limit = 1;

            var sql = 'SELECT * from POs' + (conditionStr == '' ? '' : ' WHERE ') + conditionStr + ' order by created ASC LIMIT ' + startIndex + ',' + limit;

            var records = this.getDataSource().fetchAll(sql);

            if (!records) {
                return null;
            }

            var count = this.findCount(conditionStr);

            return {list: records, count: count};
        },

        findSuppliers: function() {
            var sql = 'SELECT distinct supplier_name, supplier_code from POs order by supplier_name, supplier_code';

            return this.getDataSource().fetchAll(sql);
        },

        findGoodsReceiving: function(id) {
            var record = this.findById(id || this.id, 2);

            return record.GR || [];
        },

        getItems: function(id) {
            return this.PODetail.findByIndex('all', {
                index: 'po_id',
                value: id || this.id,
                order: 'seq ASC'
            }) || [];
        },

        closeByNumber: function(no) {
            var sql = 'UPDATE POs set open = 0 WHERE no = "' + no + '"';

            this.getDataSource().execute(sql);
        },

        del: function(id, cascade) {
            this._super(id || this.id, cascade);

            if (cascade) {
                this.PODetail.deleteByIndex('po_id', id || this.id);
            }
        }
    };

    var POModel = window.POModel = AppModel.extend(__model__);

})();

(function() {

    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }
    
    var __model__ = {

        name: 'GR',

        useDbConfig: 'inventory',

        table: 'GRs',
        
        hasMany: [{name: 'GRDetail',
                   table: 'GR_details',
                   primaryKey: 'id',
                   foreignKey: 'gr_id'
                  }],

        belongsTo: [{name: 'PO',
                     table: 'POs',
                     primaryKey: 'no',
                     foreignKey: 'po_no'
                    }],
        
        createStore: function() {

            var ds = this.datasource;
            
            // table GRs
            var sql = 'CREATE TABLE IF NOT EXISTS "GRs" \
                       ("id" VARCHAR PRIMARY KEY NOT NULL , \
                        "no" VARCHAR NOT NULL UNIQUE , \
                        "po_no" VARCHAR NOT NULL , \
                        "supplier_code" VARCHAR NOT NULL , \
                        "supplier_name" VARCHAR NOT NULL , \
                        "desc" TEXT, \
                        "total" FLOAT NOT NULL  DEFAULT 0 , \
                        "open" INTEGER NOT NULL , \
                        "count" INTEGER NOT NULL DEFAULT 0 , \
                        "committed" INTEGER NOT NULL DEFAULT 0 , \
                        "clerk" VARCHAR NOT NULL , \
                        "clerk_name" VARCHAR NOT NULL , \
                        "terminal" VARCHAR NOT NULL , \
                        "created" INTEGER NOT NULL , \
                        "modified" INTEGER NOT NULL );';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GRs_po_no" ON "GRs" ("po_no" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GRs_open" ON "GRs" ("open" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GRs_committed" ON "GRs" ("committed" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GRs_clerk" ON "GRs" ("clerk" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GRs_terminal" ON "GRs" ("terminal" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GRs_created" ON "GRs" ("created" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GRs_modified" ON "GRs" ("modified" ASC);';
            if (!ds.execute(sql)) return false;

            return true;
        },

        findGRList: function(startTimestamp, endTimestamp, grNumber, poNumber, supplierCode, supplierName, status, startIndex, limit) {
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

            // GR number
            grNumber = grNumber.trim();
            if (grNumber.length > 0) {
                conditionStr += (conditionStr ? ' AND ' : '') + 'no like "%' + grNumber + '%"';
            }

            // PO number
            poNumber = poNumber.trim();
            if (poNumber.length > 0) {
                conditionStr += (conditionStr ? ' AND ' : '') + 'po_no like "%' + poNumber + '%"';
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

            var sql = 'SELECT * from GRs' + (conditionStr == '' ? '' : ' WHERE ') + conditionStr + ' ORDER BY created ASC LIMIT ' + startIndex + ',' + limit;

            var records = this.getDataSource().fetchAll(sql);

            if (!records) {
                return records;
            }

            var count = this.findCount(conditionStr);

            return {list: records, count: count};
        },

        findSuppliers: function() {
            var sql = 'SELECT distinct supplier_name, supplier_code FROM GRs ORDER BY supplier_name, supplier_code';

            return this.getDataSource().fetchAll(sql);
        },

        closeByNumber: function(no) {
            var sql = 'UPDATE GRs set open = 0 WHERE no = "' + no + '"';

            return this.getDataSource().execute(sql);
        },

        del: function(id, cascade) {
            var rc = this._super(id, cascade);

            if (rc && cascade) {
                rc = this.GRDetail.deleteByIndex('gr_id', id);
            }
            return rc;
        }

    };

    var GRModel = window.GRModel = AppModel.extend(__model__);

})();

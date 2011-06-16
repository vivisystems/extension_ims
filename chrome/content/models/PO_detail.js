(function() {

    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }
    
    var __model__= {
        
        name: 'PODetail',

        useDbConfig: 'inventory',

        table: 'PO_details',

        belongsTo: [{
            name: 'PO',
            table: 'POs',
            primaryKey: 'id',
            foreignKey: 'po_id'
        }],

        createStore: function() {

            var ds = this.datasource;

            // table PO_details
            var sql = 'CREATE TABLE IF NOT EXISTS "PO_details" \
                   ("id" VARCHAR PRIMARY KEY  NOT NULL , \
                    "po_id" VARCHAR NOT NULL , \
                    "seq" INTEGER NOT NULL , \
                    "no" VARCHAR NOT NULL , \
                    "name" VARCHAR NOT NULL , \
                    "price" FLOAT NOT NULL , \
                    "qty" FLOAT NOT NULL , \
                    "unit" VARCHAR NOT NULL , \
                    "total" FLOAT NOT NULL , \
                    "clerk" VARCHAR NOT NULL , \
                    "clerk_name" VARCHAR NOT NULL , \
                    "created" INTEGER NOT NULL , \
                    "modified" INTEGER NOT NULL );';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "PO_details_no" ON "PO_details" ("no" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "PO_details_seq" ON "PO_details" ("seq" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "PO_details_po_id" ON "PO_details" ("po_id" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "PO_details_clerk" ON "PO_details" ("clerk" ASC);';
            if (!ds.execute(sql)) return false;

            return true;
        },

        deleteByIndex: function(index, value) {
            var sql = 'DELETE from PO_details WHERE ' + index + ' = "' + value + '"';

            return this.datasource.execute(sql);
        },

        replaceRecords: function(parentId, newRecords) {
            var sql = 'DELETE from PO_details WHERE po_id = "' + parentId + '"';

            if (!this.datasource.execute(sql)) return false;

            return this.saveAll(newRecords);
        }
    };

    var PODetailModel = window.PODetailModel = AppModel.extend(__model__);

})();

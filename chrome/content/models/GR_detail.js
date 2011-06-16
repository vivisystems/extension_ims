(function() {

    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }
    
    var __model__ = {
        
        name: 'GRDetail',

        useDbConfig: 'inventory',

        table: 'GR_details',

        belongsTo: [{
            name: 'GR',
            table: 'GRs',
            primaryKey: 'id',
            foreignKey: 'gr_id'
        }],

        createStore: function() {

            var ds = this.datasource;

            // table GR_details
            var sql = 'CREATE TABLE IF NOT EXISTS "GR_details" \
                       ("id" VARCHAR PRIMARY KEY  NOT NULL , \
                        "gr_id" VARCHAR NOT NULL , \
                        "seq" INTEGER NOT NULL , \
                        "no" VARCHAR NOT NULL , \
                        "name" VARCHAR NOT NULL , \
                        "price" FLOAT NOT NULL , \
                        "qty" FLOAT NOT NULL , \
                        "total" FLOAT NOT NULL , \
                        "order_qty" FLOAT NOT NULL , \
                        "unit" VARCHAR NOT NULL , \
                        "clerk" VARCHAR NOT NULL , \
                        "clerk_name" VARCHAR NOT NULL , \
                        "commit_price" FLOAT , \
                        "commit_qty" FLOAT , \
                        "commit_date" INTEGER , \
                        "commit_clerk" VARCHAR , \
                        "commit_clerk_name" VARCHAR , \
                        "created" INTEGER NOT NULL , \
                        "modified" INTEGER NOT NULL );';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GR_details_gr_id" ON "GR_details" ("gr_id" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GR_details_no" ON "GR_details" ("no" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GR_details_qty" ON "GR_details" ("qty" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GR_details_commit_date" ON "GR_details" ("commit_date" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GR_details_commit_clerk" ON "GR_details" ("commit_clerk" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "GR_details_clerk" ON "GR_details" ("clerk" ASC);';
            if (!ds.execute(sql)) return false;

            return true;
        },
        
        deleteByIndex: function(index, value) {
            var sql = 'DELETE from GR_details WHERE ' + index + ' = "' + value + '"';

            return this.datasource.execute(sql);
        },

        replaceRecords: function(parentId, newRecords) {
            var sql = 'DELETE from GR_details WHERE gr_id = "' + parentId + '"';

            if (!this.datasource.execute(sql)) return false;

            return this.saveAll(newRecords);
        }
    };

    var GRDetailModel = window.GRDetailModel = AppModel.extend(__model__);

})();

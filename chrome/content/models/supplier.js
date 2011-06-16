(function() {

    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }
    
    var __model__ = {

        name: 'Supplier',

        useDbConfig: 'inventory',

        createStore: function() {

            var ds = this.datasource;
            
            // table suppliers
            var sql = 'CREATE TABLE IF NOT EXISTS "suppliers" \
                       ("id" VARCHAR PRIMARY KEY NOT NULL , \
                        "code" VARCHAR NOT NULL , \
                        "name" VARCHAR NOT NULL, \
                        "contact_person" VARCHAR , \
                        "phone" VARCHAR, \
                        "fax" VARCHAR, \
                        "email" VARCHAR, \
                        "address1" VARCHAR, \
                        "address2" VARCHAR, \
                        "zip" VARCHAR, \
                        "city" VARCHAR, \
                        "state" VARCHAR, \
                        "country" VARCHAR, \
                        "notes" TEXT, \
                        "status" BOOL, \
                        "clerk" VARCHAR NOT NULL , \
                        "clerk_name" VARCHAR NOT NULL , \
                        "terminal" VARCHAR NOT NULL , \
                        "created" INTEGER, \
                        "modified" INTEGER)';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "suppliers_code_name" ON "suppliers" ("code" ASC, "name" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "suppliers_status" ON "suppliers" ("status" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "suppliers_clerk" ON "suppliers" ("clerk" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "suppliers_terminal" ON "suppliers" ("terminal" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "suppliers_created" ON "suppliers" ("created" ASC);';
            if (!ds.execute(sql)) return false;
            sql = 'CREATE INDEX IF NOT EXISTS "suppliers_modified" ON "suppliers" ("modified" ASC);';
            if (!ds.execute(sql)) return false;

            return true;
        }
    };

    var SupplierModel = window.SupplierModel = AppModel.extend(__model__);

})();

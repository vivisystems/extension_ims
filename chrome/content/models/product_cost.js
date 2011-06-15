(function() {

    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }
    
    var __model__ = {

        name: 'ProductCost',

        useDbConfig: 'inventory',

        _cache: {},

        createStore: function() {

            var ds = this.datasource;
            
            // table product_costs
            var sql = 'CREATE TABLE IF NOT EXISTS "product_costs" \
                       ("id" VARCHAR PRIMARY KEY  NOT NULL , \
                        "no" VARCHAR NOT NULL  UNIQUE , \
                        "avg_cost" FLOAT NOT NULL , \
                        "last_cost" FLOAT NOT NULL , \
                        "acc_qty" FLOAT NOT NULL , \
                        "last_gr_no" VARCHAR, \
                        "created" INTEGER NOT NULL , \
                        "modified" INTEGER NOT NULL );';
            ds.execute(sql);
            sql = 'CREATE INDEX IF NOT EXISTS "product_costs_last_gr_no" ON "product_costs" ("last_gr_no" ASC);';
            ds.execute(sql);
        }
    };

    var ProductCostModel = window.ProductCostModel = AppModel.extend(__model__);

})();

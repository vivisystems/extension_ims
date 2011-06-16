(function() {

    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }
    
    var __model__ = {

        name: 'ProductCost',

        useDbConfig: 'inventory',

        createStore: function() {

            var ds = this.datasource;
            
            // table product_costs
            var sql = 'CREATE TABLE IF NOT EXISTS "product_costs" \
                       ("id" VARCHAR PRIMARY KEY  NOT NULL , \
                        "avg_cost" FLOAT NOT NULL , \
                        "last_cost" FLOAT NOT NULL , \
                        "acc_qty" FLOAT NOT NULL , \
                        "last_gr_no" VARCHAR, \
                        "created" INTEGER NOT NULL , \
                        "modified" INTEGER NOT NULL );';
            ds.execute(sql);
            sql = 'CREATE INDEX IF NOT EXISTS "product_costs_last_gr_no" ON "product_costs" ("last_gr_no" ASC);';
            ds.execute(sql);
        },

        cacheProductCosts: function() {
            var costs = this.find('all');
            var cache = {};

            if (costs) {
                costs.forEach(function(c) {
                    cache[c.id] = c;
                });
            }

            GeckoJS.Session.set('spims_product_costs', cache);
        },

        getProductCosts: function(id) {
            var cache = GeckoJS.Session.get('spims_product_costs');
            var record;
            if (cache) {
                record = cache[id];
            }

            if (!record) {
                record = this.findByIndex('first', {
                    index: 'id',
                    value: id
                });
            }

            return record;
        },

        del: function(id) {
            var myId = (id || this.id);
            this._super(id);

            // update cache
            var cache = GeckoJS.Session.get('spims_product_costs');
            delete cache[myId];
        },

        save: function(data) {
            this._super(data);

            // update cache
            var cache = GeckoJS.Session.get('spims_product_costs');
            cache[data.id || this.id] = data;
        }
    };

    var ProductCostModel = window.ProductCostModel = AppModel.extend(__model__);

})();

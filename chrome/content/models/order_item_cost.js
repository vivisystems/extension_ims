( function() {
    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }

    var __model__ = {

        name: 'OrderItemCost',

        useDbConfig: 'order',

        belongsTo: [{
            name: 'OrderItem',
            table: 'order_items',
            primaryKey: 'id',
            foreignKey: 'id'
        }],

        behaviors: ['Sync'],

        autoRestoreFromBackup: true,

        createStore: function() {
            
            var ds = this.datasource;
            
            // table order_item_costs
            var sql = 'CREATE TABLE IF NOT EXISTS "order_item_costs" \
                       ("id" VARCHAR PRIMARY KEY  NOT NULL , \
                        "avg_cost" FLOAT, \
                        "last_cost" FLOAT, \
                        "manual_cost" FLOAT, \
                        "created" INTEGER NOT NULL , \
                        "modified" INTEGER NOT NULL );';
            if (!ds.execute(sql)) return false;

            // create table in history database
            var rc = true;
            var attachedOrderHistory = this.attachOrderHistory();
            if (attachedOrderHistory) {
                try {
                    sql = sql.replace('"order_item_costs"', 'order_history."order_item_costs"');
                    if (!ds.execute(sql)) throw 'failed to create';
                }
                catch(e) {
                    rc = false;
                }
                finally {
                    this.detachOrderHistory();
                }
            }

            return rc;
        },

        saveItemCosts: function(items) {

            var productCostModel = new ProductCostModel();
            var itemCosts = [];
            for (var id in items) {
                var item = items[id];
                var itemCost = {
                    order_item_id: id,
                    manual_cost: null,
                    avg_cost: null,
                    last_cost: null
                }

                // get last prices from cache
                var costs = productCostModel.getProductCosts(item.no);
                if (costs) {
                    itemCost.avg_cost = costs.avg_cost;
                    itemCost.last_cost = costs.last_cost;
                    itemCost.manual_cost = costs.manual_cost;
                }
                itemCosts.push(itemCost);
            }
            var rc = this.saveAll(itemCosts);

            this.lastReadyState = 4;
            this.lastStatus = 200;

            return rc;
        }
    };

    var OrderItemCostModel = window.OrderItemCostModel =  AppModel.extend(__model__);

} )();

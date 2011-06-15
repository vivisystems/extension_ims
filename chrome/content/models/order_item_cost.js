( function() {
    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }

    var __model__ = {

        name: 'OrderItemCost',

        useDbConfig: 'order',

        belongsTo: ['OrderItem'],

        behaviors: ['Sync', 'Training'],

        autoRestoreFromBackup: true,

        createStore: function() {

            var ds = this.datasource;
            
            // table order_item_costs
            var sql = 'CREATE TABLE IF NOT EXISTS "order_item_costs" \
                       ("id" VARCHAR PRIMARY KEY  NOT NULL , \
                        "order_item_id" VARCHAR NOT NULL  UNIQUE , \
                        "avg_cost" FLOAT NOT NULL, \
                        "last_cost" FLOAT NOT NULL, \
                        "manual_cost" FLOAT NOT NULL, \
                        "created" INTEGER NOT NULL , \
                        "modified" INTEGER NOT NULL );';
            ds.execute(sql);
        }

    };

    var OrderItemCostModel = window.OrderItemCostModel =  AppModel.extend(__model__);

} )();

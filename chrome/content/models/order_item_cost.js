( function() {
    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }

    var __model__ = {

        name: 'OrderItemCost',

        useDbConfig: 'order',

        belongsTo: ['OrderItem'],
        belongsTo: [{
            name: 'OrderItem',
            table: 'order_items',
            primaryKey: 'id',
            foreignKey: 'id'
        }],

        behaviors: ['Sync'],

        autoRestoreFromBackup: true,

        httpService: null,

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

        getHttpService: function() {

            try {
                if (!this.httpService) {
                    var syncSettings = SyncSetting.read();
                    this.httpService = new SyncbaseHttpService();
                    this.httpService.setSyncSettings(syncSettings);
                    this.httpService.setHostname(syncSettings.stock_hostname);
                    this.httpService.setController('stocks');
                    this.httpService.setForce(true);
                }
            }catch(e) {
                this.log('error ' + e);
            }

            return this.httpService;
        },

        getHostname: function() {
            return this.getHttpService().getHostname();
        },

        isRemoteService: function() {
            return !this.getHttpService().isLocalhost();
        },

        saveItemCosts: function(items) {

            if(this.isRemoteService()) {

                var remoteUrl = this.getHttpService().getRemoteServiceUrl('decreaseStockRecords');
                var requestUrl = remoteUrl + '/' + this.lastModified;

                var request_data = GeckoJS.BaseObject.serialize(datas);
                var response_data = this.getHttpService().requestRemoteService('POST', requestUrl, request_data, async, callback) || null ;

                this.lastReadyState = this.getHttpService().lastReadyState;
                this.lastStatus = this.getHttpService().lastStatus;

                if (response_data) {
                    var remoteStocks;

                    try {
                        //
                        remoteStocks = GeckoJS.BaseObject.unserialize(GREUtils.Gzip.inflate(atob(response_data)));

                    }catch(e) {
                        this.lastStatus = 0;
                        this.log('ERROR', 'decreaseStockRecords cant decode response '+e);
                    }

                }


            }else {
                var productsById = GeckoJS.Session.get('productsById');
                var productCostModel = new ProductCostModel();
                var itemCosts = [];
                for (var id in items) {
                    var item = items[id];
                    var prod = productsById[item.id];
                    var itemCost = {
                        id: id,
                        manual_cost: null,
                        avg_cost: null,
                        last_cost: null
                    }

                    // get manual cost
                    if (prod && prod.buy_price != null && prod.buy_price != '') {
                        itemCost.manual_cost = prod.buy_price;
                    }

                    // get last prices from cache
                    var costs = productCostModel.getProductCosts(prod.no);
                    if (costs) {
                        itemCost.avg_cost = costs.avg_cost;
                        itemCost.last_cost = costs.last_cost;
                    }

                    itemCosts.push(itemCost);
                }
                var rc = this.saveAll(itemCosts);

                this.lastReadyState = 4;
                this.lastStatus = 200;

                return rc;
            }
        }
    };

    var OrderItemCostModel = window.OrderItemCostModel =  AppModel.extend(__model__);

} )();

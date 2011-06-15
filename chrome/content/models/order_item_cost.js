( function() {
    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }

    var __model__ = {

        name: 'OrderItemCost',

        useDbConfig: 'order',

        belongsTo: ['OrderItem'],

        behaviors: ['Sync'],

        autoRestoreFromBackup: true,

        httpService: null,

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
                for (var id in items) {
                    var item = items[id];
                    var prod = productsById[item.id];
                    var manual_cost = 0;
                    if (prod) {
                        manual_cost = prod.buy_price;
                    }



                }

                this.lastReadyState = 4;
                this.lastStatus = 200;

            }
        }
    };

    var OrderItemCostModel = window.OrderItemCostModel =  AppModel.extend(__model__);

} )();

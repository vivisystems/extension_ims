(function() {

    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }
    
    var __model__ = {

        name: 'ProductCost',

        useDbConfig: 'inventory',

        httpService: null,

        lastModified: 0,

        createStore: function() {

            var ds = this.datasource;
            
            // table product_costs
            var sql = 'CREATE TABLE IF NOT EXISTS "product_costs" \
                       ("id" VARCHAR PRIMARY KEY  NOT NULL , \
                        "avg_cost" FLOAT NOT NULL , \
                        "last_cost" FLOAT NOT NULL , \
                        "manual_cost" FLOAT NOT NULL , \
                        "acc_qty" FLOAT NOT NULL , \
                        "last_gr_no" VARCHAR, \
                        "created" INTEGER NOT NULL , \
                        "modified" INTEGER NOT NULL );';

            if (!ds.execute(sql)) return false;

            sql = 'CREATE INDEX IF NOT EXISTS "product_costs_last_gr_no" ON "product_costs" ("last_gr_no" ASC);';
            if (!ds.execute(sql)) return false;

            return true;
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
            }
            catch(e) {
                this.log('ERROR', 'error in reading stock service settings: ' + e);
            }

            return this.httpService;
        },

        getHostname: function() {
            return this.getHttpService().getHostname();
        },

        isRemoteService: function() {
            return !this.getHttpService().isLocalhost();
        },

        cacheProductCosts: function() {
            var cache = {};

            if (this.isRemoteService()) {
                var remoteUrl = this.getHttpService().getRemoteServiceUrl('getLastModifiedRecords');
                var requestUrl = remoteUrl + '/' + this.lastModified;
                var self = this;

                var cb = function(response_data) {

                    var remoteCosts;

                    self.lastReadyState = self.getHttpService().lastReadyState;
                    self.lastStatus = self.getHttpService().lastStatus;

                    if (response_data) {
                        try {
                            //
                            remoteCosts = GeckoJS.BaseObject.unserialize(GREUtils.Gzip.inflate(atob(response_data)));

                        }catch(e) {
                            self.lastStatus = 0;
                            remoteCosts = [];
                            this.log('ERROR', 'getLastModifiedRecords cant decode response '+e);
                        }

                        remoteCosts.forEach(function(cost) {
                            cache[cost.id] = cost;
                            if (cost.modified > self.lastModified) self.lastModified = cost.modified;
                        })
                    }

                    self.log('DEBUG', 'cacheProductCosts: ' + self.dump(self._cachedRecords));

                };

                var remoteCostResults = this.getHttpService().requestRemoteService('GET', requestUrl, null, null, null) || null ;
                cb.call(self, remoteCostResults);

            }
            else {

                this.lastReadyState = 4;
                this.lastStatus = 200;

                var costs = this.find('all');

                if (costs) {
                    costs.forEach(function(c) {
                        cache[c.id] = c;
                    });
                }
            }
            GeckoJS.Session.set('ims_product_costs', cache);

            return (this.lastStatus == 200);
        },

        getProductCosts: function(id) {

            if (this.isRemoteService()) {
                if (!this.cacheProductCosts()) {
                    return false;
                }
            }

            var cache = GeckoJS.Session.get('ims_product_costs');
            var record;
            if (cache) {
                record = cache[id];
            }

            if (this.isRemoteService()) {

            }
            else {
                if (!record) {
                    record = this.findByIndex('first', {
                        index: 'id',
                        value: id
                    });

                    if (parseInt(this.lastError) != 0) {
                        return false;
                    }
                }

                if (!record) {
                    record = {};
                }

                var productsById = GeckoJS.Session.get('productsById');
                var prod = productsById[id];
                // get manual cost
                if (prod && prod.buy_price != null && prod.buy_price != '') {
                    record.manual_cost = prod.buy_price;
                }
            }

            return record;
        },

        del: function(id) {
            var myId = (id || this.id);
            var rc = this._super(id);

            // update cache
            if (rc) {
                var cache = GeckoJS.Session.get('ims_product_costs');
                delete cache[myId];
            }
            return rc;
        },

        save: function(data) {
            var rc = this._super(data);

            // update cache
            if (rc) {
                var cache = GeckoJS.Session.get('ims_product_costs');
                cache[data.id || this.id] = data;
            }
            return rc;
        },

        truncate: function() {
            var rc = this._super();

            // update cache
            if (rc) {
                GeckoJS.Session.get('ims_product_costs', {});
            }
            return rc;
        }
    };

    var ProductCostModel = window.ProductCostModel = AppModel.extend(__model__);

})();

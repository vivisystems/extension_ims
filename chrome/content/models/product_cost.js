(function() {

    if(typeof AppModel == 'undefined') {
        include( 'chrome://viviecr/content/models/app.js' );
    }
    
    include('chrome://viviecr/content/utils/syncbase_http_service.js');
    
    var __model__ = {

        name: 'ProductCost',

        useDbConfig: 'inventory',

        httpService: null,

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
                    this.httpService.setController('ims/product_costs');
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
            var cache = GeckoJS.Session.get('ims_product_costs') || {};
            var lastModified = GeckoJS.Session.get('ims_product_costs_modified') || 0;

            if (this.isRemoteService()) {
                var remoteUrl = this.getHttpService().getRemoteServiceUrl('getLastModifiedRecords');
                var updatedModified = lastModified;
                var requestUrl = remoteUrl + '/' + lastModified;
                var self = this;

                var cb = function(response_data) {

                    var remoteCosts;

                    self.lastReadyState = self.getHttpService().lastReadyState;
                    self.lastStatus = self.getHttpService().lastStatus;

                    if (response_data) {
                        try {
                            remoteCosts = GeckoJS.BaseObject.unserialize(GREUtils.Gzip.inflate(atob(response_data)));
                        }catch(e) {
                            self.lastStatus = 0;
                            remoteCosts = [];
                            this.log('ERROR', 'failed to decode getLastModifiedRecords response '+e);
                        }

                        remoteCosts.forEach(function(cost) {
                            cache[cost.id] = cost;
                            if (parseInt(cost.modified) > updatedModified) {
                                updatedModified = parseInt(cost.modified);
                            }
                        })
                    }
                };

                try {
                    var remoteCostResults = this.getHttpService().requestRemoteService('GET', requestUrl, null, false, null, false);
                    cb.call(self, remoteCostResults);

                    if (updatedModified > lastModified) {
                        GeckoJS.Session.set('ims_product_costs_modified', updatedModified);
                    }
                }
                catch(e) {
                    this.lastStatus = 0;
                    this.log('ERROR', 'failed on remote request to [' + requestUrl + ']\n' + e);
                }
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

        getProductCosts: function(id, cached) {
            if (!cached && this.isRemoteService()) {
                if (!this.cacheProductCosts()) {
                    this.log('ERROR', 'Failed to update product costs from stock service, using cached values');
                }
            }

            var cache = GeckoJS.Session.get('ims_product_costs');
            var record;

            if (cache) {
                record = cache[id];
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

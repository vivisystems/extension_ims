( function() {

    include( 'chrome://viviecr/content/reports/controllers/rpt_base_controller.js' );

    var __controller__ = {

        name: 'RptProfitAndLossSummary',

        packageName: 'ims',

        uses: ['Order', 'OrderItem'],

        _fileName: 'rpt_profit_and_loss_summary',

        _prefix: 'vivipos.fec.reportpanels.ims_profitandlosssummary',

        _set_reportRecords: function( limit ) {

            limit = parseInt( limit );
            if ( isNaN( limit ) || limit <= 0 ) limit = this._stdLimit;

            var start = document.getElementById( 'start_date' ).value;
            var end = document.getElementById( 'end_date' ).value;

            var start_str = document.getElementById( 'start_date' ).datetimeValue.toString( 'yyyy/MM/dd HH:mm' );
            var end_str = document.getElementById( 'end_date' ).datetimeValue.toString( 'yyyy/MM/dd HH:mm' );

            var terminal_no = document.getElementById( 'terminal_no' ).value;
            var periodType = document.getElementById( 'period_type' ).value;

            var costType = document.getElementById( 'cost_type' ).value;

            var excludeTax = document.getElementById( 'exclude_tax' ).checked;
            GeckoJS.Configure.write(this._prefix + '.exclude_tax', excludeTax);

            var excludeSVC = document.getElementById( 'exclude_svc' ).checked;
            GeckoJS.Configure.write(this._prefix + '.exclude_svc', excludeSVC);

            var excludePromotion = document.getElementById( 'exclude_promotion' ).checked;
            GeckoJS.Configure.write(this._prefix + '.exclude_promotion', excludePromotion);

            var excludeRevalue = document.getElementById( 'exclude_revalue' ).checked;
            GeckoJS.Configure.write(this._prefix + '.exclude_revalue', excludeRevalue);

            var excludeCondiment = document.getElementById( 'exclude_condiment' ).checked;
            GeckoJS.Configure.write(this._prefix + '.exclude_condiment', excludeCondiment);

            var excludeAdjustment = document.getElementById( 'exclude_adjustment' ).checked;
            GeckoJS.Configure.write(this._prefix + '.exclude_adjustment', excludeAdjustment);

            start = parseInt( start / 1000, 10 );
            end = parseInt( end / 1000, 10 );

            // for computing gross sales, total taxes, total promotion, total revalue, total service charge, total adjustment
            var order_fields = [
                            'orders.terminal_no',
                            'strftime( "%Y-%m-%d", "orders"."' + periodType + '", "unixepoch", "localtime" ) AS "date"',
                            'SUM("orders"."total") as "GrossSales"',
                            'SUM("orders"."tax_subtotal") as "Tax"',
                            'SUM("orders"."included_tax_subtotal") as "IncludedTax"',
                            'SUM("orders"."item_surcharge_subtotal") as "ItemSurcharge"',
                            'SUM("orders"."item_discount_subtotal") as "ItemDiscount"',
                            'SUM("orders"."trans_surcharge_subtotal") as "OrderSurcharge"',
                            'SUM("orders"."trans_discount_subtotal") as "OrderDiscount"',
                            'SUM("orders"."promotion_subtotal") as "Promotion"',
                            'SUM("orders"."revalue_subtotal") as "Revalue"',
                            'SUM("orders"."service_charge_subtotal") as "ServiceCharge"',
                            'SUM("orders"."included_service_charge_subtotal") as "IncludedServiceCharge"'
            ];

            var order_conditions = "orders." + periodType + ">='" + start +
                            "' AND orders." + periodType + "<='" + end +
                            "' AND orders.status=1 ";

            // for computing item sales, total condiments, total costs
            var item_fields = [
                            'orders.terminal_no',
                            'strftime( "%Y-%m-%d", "orders"."' + periodType + '", "unixepoch", "localtime" ) AS "date"',
                            'SUM("order_items"."current_subtotal") as "ItemSales"',
                            'SUM("order_items"."current_condiment") as "Condiment"',
                            'SUM("order_items"."current_qty" * IFNULL("order_item_costs"."' + costType +'",0) * LIKE("order_items"."sale_unit", "unit") + "order_items"."weight" * IFNULL("order_item_costs"."' + costType +'",0) * (1 - LIKE("order_items"."sale_unit", "unit"))) as "TotalCost"'
                         ];
                         
            var item_conditions = "orders." + periodType + ">='" + start +
                            "' AND orders." + periodType + "<='" + end +
                            "' AND orders.status=1 ";

            if ( terminal_no.length > 0 ) {
                order_conditions += " AND orders.terminal_no LIKE '" + this._queryStringPreprocessor( terminal_no ) + "%'";
                item_conditions += " AND orders.terminal_no LIKE '" + this._queryStringPreprocessor( terminal_no ) + "%'";
            }
            var groupby = ' orders.terminal_no, strftime( "%Y-%m-%d", "orders"."' + periodType + '", "unixepoch", "localtime")';
            var orderby = ' orders.terminal_no, strftime( "%Y-%m-%d", "orders"."' + periodType + '", "unixepoch", "localtime")';

            var orderDataIndex = {};

            // get order sales data
            var orderDataRecords = this.Order.getDataSource().fetchAll(
                "SELECT " + order_fields.join( ", " ) +
                " FROM orders " +
                " WHERE " + order_conditions +
                " GROUP BY " + groupby +
                " ORDER BY " + orderby +
                " LIMIT 0, " + limit + ";"
            ) || [];
            orderDataRecords.forEach(function(o) {
                if (!(o.terminal_no in orderDataIndex)) {
                    orderDataIndex[o.terminal_no] = {};
                }
                orderDataIndex[o.terminal_no][o.date] = o;
            });

            // get item sales data
            var orderItemRecords = this.OrderItem.getDataSource().fetchAll(
                "SELECT " + item_fields.join( ", " ) +
                " FROM orders INNER JOIN order_items ON (orders.id = order_items.order_id )" +
                " LEFT JOIN order_item_costs ON (order_items.id = order_item_costs.id)" +
                " WHERE " + item_conditions +
                " GROUP BY " + groupby +
                " ORDER BY " + orderby +
                " LIMIT 0, " + limit + ";"
            ) || [];

            // merge item sales data into order sales data
            orderItemRecords.forEach(function(item) {
                if (!item.terminal_no in orderDataIndex) {
                    // should not happen
                    this.log('WARN', 'terminal [' + item.terminal_no + '] found in item sales but not in order sales');
                    orderDataIndex[item.terminal_no] = {};
                }

                if (!item.date in orderDataIndex[item.terminal_no]) {
                    // should not happen
                    this.log('WARN', 'date [' + item.date + '] found in item sales but not in order sales');
                    orderDataIndex[item.terminal_no][item.date] = {
                        terminal_no: item.terminal_no,
                        date: item.date,
                        GrossSales: 0,
                        ItemSales: 0,
                        AdjustedSales: 0,
                        ItemDiscount: 0,
                        ItemSurcharge: 0,
                        OrderDiscount: 0,
                        OrderSurcharge: 0,
                        Tax: 0,
                        IncludedTax: 0,
                        Promotion: 0,
                        Revalue: 0,
                        ServiceCharge: 0,
                        IncludedServiceCharge: 0
                    };
                }

                orderDataIndex[item.terminal_no][item.date].ItemSales = item.ItemSales - item.Condiment;
                orderDataIndex[item.terminal_no][item.date].Condiment = item.Condiment;
                orderDataIndex[item.terminal_no][item.date].TotalCost = item.TotalCost;
            })
            
            // get net sales
            var footDatas = {
                ItemSales: 0,
                Condiment: 0,
                ItemSurcharge: 0,
                ItemDiscount: 0,
                OrderSurcharge: 0,
                OrderDiscount: 0,
                Tax: 0,
                IncludedTax: 0,
                Promotion: 0,
                Revalue: 0,
                ServiceCharge: 0,
                IncludedServiceCharge: 0,
            	GrossSales: 0,
                AdjustedSales: 0,
            	TotalCost: 0,
            	GrossProfit: 0
            };

            orderDataRecords.forEach( function( data ) {

                data.AdjustedSales = data.GrossSales;
                
                if (excludeTax) {
                    data.AdjustedSales = data.AdjustedSales - data.Tax - data.IncludedTax;
                }

                if (excludeSVC) {
                    data.AdjustedSales = data.AdjustedSales - data.ServiceCharge - data.IncludedServiceCharge;
                }

                if (excludePromotion) {
                    data.AdjustedSales -= data.Promotion;
                }

                if (excludeRevalue) {
                    data.AdjustedSales -= data.Revalue;
                }

                if (excludeCondiment) {
                    data.AdjustedSales -= data.Condiment;
                }

                if (excludeAdjustment) {
                    data.AdjustedSales = data.AdjustedSales - data.ItemDiscount - data.ItemSurcharge - data.OrderDiscount - data.OrderSurcharge;
                }
                
                data.GrossProfit = data.AdjustedSales - data.TotalCost;
                data.GrossMargin = (data.AdjustedSales != 0) ? (data.GrossProfit * 100/ data.AdjustedSales) : null;

                data.Order = data;
                var o = data.Order;

                o.Order = o;

                footDatas.ItemSales += o.ItemSales;
                footDatas.Condiment += o.Condiment;
                footDatas.ItemSurcharge += o.ItemSurcharge;
                footDatas.ItemDiscount += o.ItemDiscount;
                footDatas.OrderSurcharge += o.OrderSurcharge;
                footDatas.OrderDiscount += o.OrderDiscount;
                footDatas.Tax += o.Tax;
                footDatas.IncludedTax += o.IncludedTax;
                footDatas.Promotion += o.Promotion;
                footDatas.Revalue += o.Revalue;
                footDatas.ServiceCharge += o.ServiceCharge;
                footDatas.IncludedServiceCharge += o.IncludedServiceCharge;
            	footDatas.GrossSales += o.GrossSales;
                footDatas.AdjustedSales += o.AdjustedSales;
            	footDatas.TotalCost += o.TotalCost;
            	footDatas.GrossProfit += o.GrossProfit;
            });


            //get Summary
            footDatas.GrossMargin = (footDatas.AdjustedSales != 0) ? (footDatas.GrossProfit * 100/ footDatas.AdjustedSales) : null;

            this._reportRecords.head.title = _( this._prefix + '.label' );
            this._reportRecords.head.start_time = start_str;
            this._reportRecords.head.end_time = end_str;
            this._reportRecords.head.terminal_no = terminal_no;

            this._reportRecords.body = orderDataRecords;

            this._reportRecords.foot.foot_datas = footDatas;
        },


        exportCsv: function() {
            this._super(this);
        },

        execute: function() {
        	this._super();
        	this._registerOpenOrderDialog();
        },

        exportPdf: function() {
            this._super( {
                paperSize: {
                    width: 297,
                    height: 210
                }
            } );
        },

        print: function() {
            this._super( {
                orientation: "landscape"
            } );
        },

        load: function() {
            this._super();

            var today = new Date();
            var yy = today.getYear() + 1900;
            var mm = today.getMonth();
            var dd = today.getDate();

            var start = ( new Date( yy, mm, dd, 0, 0, 0 ) ).getTime();
            var end = ( new Date( yy, mm, dd + 1, 0, 0, 0 ) ).getTime();

            var excludeTax = GeckoJS.Configure.read(this._prefix + '.exclude_tax') || false;
            var excludeSVC = GeckoJS.Configure.read(this._prefix + '.exclude_svc') || false;
            var excludePromotion = GeckoJS.Configure.read(this._prefix + '.exclude_promotion') || false;
            var excludeRevalue = GeckoJS.Configure.read(this._prefix + '.exclude_revalue') || false;
            var excludeCondiment = GeckoJS.Configure.read(this._prefix + '.exclude_condiment') || false;
            var excludeAdjustment = GeckoJS.Configure.read(this._prefix + '.exclude_adjustment') || false;

            document.getElementById( 'start_date' ).value = start;
            document.getElementById( 'end_date' ).value = end;
            document.getElementById( 'exclude_tax' ).checked = excludeTax;
            document.getElementById( 'exclude_svc' ).checked = excludeSVC;
            document.getElementById( 'exclude_promotion' ).checked = excludePromotion;
            document.getElementById( 'exclude_revalue' ).checked = excludeRevalue;
            document.getElementById( 'exclude_condiment' ).checked = excludeCondiment;
            document.getElementById( 'exclude_adjustment' ).checked = excludeAdjustment;

            // set button callback
            var emailBtnObj = document.getElementById('email_pdf');
            emailBtnObj.setAttribute('oncommand', "$do('emailReport', null, 'RptProfitAndLossSummary');");
        },

        emailReport: function() {
            $do('emailReport', {mode: 'report', title: _( this._prefix + '.label' )}, 'EmailPdf');
        }
    };

    RptBaseController.extend( __controller__ );
} )();


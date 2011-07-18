( function() {
    /**
     * Product Sales Controller
     */

    include( 'chrome://viviecr/content/reports/controllers/rpt_base_controller.js' );

    var __controller__ = {

        name: 'RptProfitAndLoss',

        packageName: 'ims',

        _fileName: 'rpt_profit_and_loss',

        _prefix: 'vivipos.fec.reportpanels.ims_profitandloss',
        
        _setData: function( start, end, periodType, shiftNo, sortby, terminalNo, department, empty_department, noSalesProduct, limit, selectCategory ) {
            // initial order history if user selected it.
            var useDbConfig = this.initOrderHistoryDatabase();

            var start_str = ( new Date( start ) ).toString( 'yyyy/MM/dd HH:mm' );
            var end_str = ( new Date( end ) ).toString( 'yyyy/MM/dd HH:mm' );

            var costType = document.getElementById( 'cost_type' ).value;

            var excludeTax = document.getElementById( 'exclude_tax' ).checked;
            GeckoJS.Configure.write(this._prefix + '.exclude_tax', excludeTax);

            var excludeSVC = document.getElementById( 'exclude_svc' ).checked;
            GeckoJS.Configure.write(this._prefix + '.exclude_svc', excludeSVC);

            var excludeAdjustment = document.getElementById( 'exclude_adjustment' ).checked;
            GeckoJS.Configure.write(this._prefix + '.exclude_adjustment', excludeAdjustment);

            var excludeCondiment = document.getElementById( 'exclude_condiment' ).checked;
            GeckoJS.Configure.write(this._prefix + '.exclude_condiment', excludeCondiment);
            
            start = parseInt( start / 1000, 10 );
            end = parseInt( end / 1000, 10 );

            // used to check if multiple non-unit sale units exist
            var saleUnit = 'unit';
            var multipleSaleUnits = false;

            var orderItem = new OrderItemModel();

            orderItem.useDbConfig = useDbConfig; // udpate dbconfig

            var fields = [
                'order_items.product_no',
                'order_items.product_name',
                'order_items.sale_unit',
                'order_items.cate_no',
                'order_items.cate_name',
                'SUM("order_items"."current_qty") as "qty"',
                'SUM("order_items"."weight") as "weight"',
                'SUM("order_items"."current_subtotal" - "order_items"."current_condiment") as "item"',
                'SUM("order_items"."current_condiment") as "condiment"',
                'SUM("order_items"."current_discount") as "discount"',
                'SUM("order_items"."current_surcharge") as "surcharge"',
                'SUM("order_items"."current_service_charge") as "service_charge"',
                'SUM("order_items"."included_service_charge") as "included_service_charge"',
                'SUM("order_items"."current_tax") as "tax"',
                'SUM("order_items"."included_tax") as "included_tax"',
                'SUM("order_items"."current_qty" * IFNULL("order_item_costs"."' + costType +'",0) * LIKE("order_items"."sale_unit", "unit") + "order_items"."weight" * IFNULL("order_item_costs"."' + costType +'",0) * (1 - LIKE("order_items"."sale_unit", "unit"))) as "cost"'
            ];

            var setitem_fields = [
                'order_items.product_no',
                'order_items.parent_no',
                'order_items.cate_no',
                'SUM("order_items"."current_condiment") as "condiment"',
                'SUM("order_items"."current_qty" * IFNULL("order_item_costs"."' + costType +'",0) * LIKE("order_items"."sale_unit", "unit") + "order_items"."weight" * IFNULL("order_item_costs"."' + costType +'",0) * (1 - LIKE("order_items"."sale_unit", "unit"))) as "cost"'
            ];

            var conditions = "orders." + periodType + ">='" + start +
                "' AND orders." + periodType + "<='" + end + "'" +
                " AND (order_items.parent_index IS NULL OR order_items.parent_index = '') AND (order_items.product_no NOT NULL AND order_items.product_no != '') " +
                " AND orders.status = 1";

            var setitem_conditions = "orders." + periodType + ">='" + start +
                "' AND orders." + periodType + "<='" + end + "'" +
                " AND (order_items.parent_index NOT NULL AND order_items.parent_index != '') AND (order_items.product_no NOT NULL AND order_items.product_no != '') " +
                " AND orders.status = 1";

            if (terminalNo.length > 0) {
                conditions += " AND orders.terminal_no LIKE '" + this._queryStringPreprocessor( terminalNo ) + "%'";
                setitem_conditions += " AND orders.terminal_no LIKE '" + this._queryStringPreprocessor( terminalNo ) + "%'";
            }

            if ( shiftNo.length > 0 ) {
                conditions += " AND orders.shift_number = '" + this._queryStringPreprocessor( shiftNo ) + "'";
                setitem_conditions += " AND orders.shift_number = '" + this._queryStringPreprocessor( shiftNo ) + "'";
            }

            var groupby = "order_items.product_no";

            var orderby = '';

            switch( sortby ) {
                case 'product_no':
                case 'product_name':
                    orderby = sortby;
                    break;

                case 'avg_price':
                case 'item':
                case 'cost':
                    orderby = '"OrderItem.' + sortby + '" desc';
                    break;

                case 'adjusted':
                    orderby = '"OrderItem.item" desc';
                    break;

                case 'qty':
                    orderby = '"OrderItem.qty" desc, "OrderItem.weight" desc';
                    break;
            }

            // prepare category stuff.
            var deptCondition = '';
            var categoryModel = new CategoryModel();
            var categoryRecords = categoryModel.find( 'all', {
                fields: [ 'no', 'name' ],
                conditions: deptCondition,
                order: 'no',
                limit: this._csvLimit
            } );

            var categories = { department:{}, group:{} };

            categoryRecords.forEach( function( categoryRecord ) {
                categories.department[ categoryRecord.no ] = {
                    no: categoryRecord.no,
                    name: categoryRecord.name,
                    orderItems: [],
                    prodByNo: {},
                    summary: {
                        qty: 0,
                        item: 0,
                        gross: 0.0,
                        condiment: 0,
                        discount: 0,
                        surcharge: 0,
                        service_charge: 0,
                        included_service_charge: 0,
                        tax: 0,
                        included_tax: 0,
                        adjusted: 0.0,
                        weight: 0,
                        cost: 0,
                        gp: 0,
                        gm: 0,
                        unit: 'unit',
                        multiple_sale_units: false
                    }
                }
            } );
            
            categories.group = this._setGroups();
            if (GeckoJS.Log.defaultClassLevel.value <= 1) this.log('DEBUG', this.dump(categories,20));

            if (GeckoJS.Log.defaultClassLevel.value <= 1) this.log('DEBUG', 'SELECT ' +fields.join(', ')+ '  FROM orders INNER JOIN order_items ON ("orders"."id" = "order_items"."order_id" )  WHERE ' + conditions + '  GROUP BY ' + groupby + ' ORDER BY ' + orderby + ' LIMIT 0, ' + this._csvLimit);
            var orderItemRecords = orderItem.getDataSource().fetchAll('SELECT ' +fields.join(', ')+ '  FROM orders INNER JOIN order_items ON ("orders"."id" = "order_items"."order_id" ) LEFT JOIN order_item_costs ON (order_items.id = order_item_costs.id) WHERE ' + conditions + '  GROUP BY ' + groupby + ' ORDER BY ' + orderby + ' LIMIT 0, ' + this._csvLimit) || [];

            if (GeckoJS.Log.defaultClassLevel.value <= 1) this.log('DEBUG', this.dump(orderItemRecords,20));

            // record set item condiment and cost by parent product number
            var setItemsByNo = {};
            var setItemRecords = orderItem.getDataSource().fetchAll('SELECT ' + setitem_fields.join(', ')+ '  FROM orders INNER JOIN order_items ON ("orders"."id" = "order_items"."order_id" ) LEFT JOIN order_item_costs ON (order_items.id = order_item_costs.id) WHERE ' + setitem_conditions + '  GROUP BY ' + groupby + ' ORDER BY ' + orderby + ' LIMIT 0, ' + this._csvLimit) || [];
            setItemRecords.forEach(function(record) {
                if (record.parent_no in setItemsByNo) {
                    setItemsByNo[record.parent_no].condiment += record.condiment;
                    setItemsByNo[record.parent_no].cost += record.cost;
                }
                else {
                    setItemsByNo[record.parent_no] = {
                        'condiment': record.condiment,
                        'cost': record.cost
                    };
                }
            });
            
            orderItemRecords.forEach( function( record ) {

                delete record.OrderItem;

                // adjust condiment if necessary
                var setItem = setItemsByNo[record.product_no];
                if (setItem) {
                    record.item -= setItem.condiment;
                    record.condiment += setItem.condiment;
                    record.cost += setItem.cost;
                }

                record.adjusted = record.gross = record.item;

                // update adjusted sales
                if (!excludeTax) {
                    record.adjusted += record.tax;
                }
                else {
                    record.adjusted -= record.included_tax;
                }
                record.gross += record.tax;

                if (!excludeAdjustment) {
                    record.adjusted += record.discount + record.surcharge;
                }
                record.gross += record.discount + record.surcharge;

                if (!excludeSVC) {
                    record.adjusted += record.service_charge;
                }
                else {
                    record.adjusted -= record.included_service_charge;
                }
                record.gross += record.service_charge;

                if (!excludeCondiment) {
                    record.adjusted += record.condiment;
                }
                record.gross += record.condiment;

                // check sale unit
                if (!multipleSaleUnits && record.sale_unit != 'unit') {
                    if (saleUnit == 'unit') saleUnit = record.sale_unit;
                    else multipleSaleUnits = (saleUnit != record.sale_unit);
                }
                record.gp = record.adjusted - record.cost;
                record.gm = (record.adjusted != 0) ? (record.gp * 100 / record.adjusted) : null;
                
                let qty;
                if (record['sale_unit'] == 'unit') qty = record['qty'];
                else {
                    qty = record['weight'];
                    record['qty'] = 0;
                }

                if (qty > 0)
                    record[ 'avg_price' ] = record[ 'adjusted' ] / qty;
                else
                    record[ 'avg_price' ] = 0.0;

                if (!(record.cate_no in categories.department)) {
                    categories.department[ record.cate_no ] = {
                        no: record.cate_no,
                        name: record.cate_name,
                        orderItems: [ record ],
                        summary: {
                            qty: record.qty,
                            cost: record.cost,
                            weight: record.weight,
                            unit: record.sale_unit,
                            gross: record.gross,
                            item: record.item,
                            condiment: record.condiment,
                            discount: record.discount,
                            surcharge: record.surcharge,
                            service_charge: record.service_charge,
                            included_service_charge: record.included_service_charge,
                            tax: record.tax,
                            included_tax: record.included_tax,
                            adjusted: record.adjusted,
                            gp: record.gp,
                            multiple_sale_units: false
                            },
                        prodByNo: {}
                    };
                }
                else {
                    categories.department[ record.cate_no ].orderItems.push( record );
                    categories.department[ record.cate_no ].summary.qty += record.qty;
                    categories.department[ record.cate_no ].summary.cost += record.cost;
                    categories.department[ record.cate_no ].summary.weight += record.weight;
                    categories.department[ record.cate_no ].summary.gross += record.gross;
                    categories.department[ record.cate_no ].summary.item += record.item;
                    categories.department[ record.cate_no ].summary.adjusted += record.adjusted;
                    categories.department[ record.cate_no ].summary.gp += record.gp;
                    categories.department[ record.cate_no ].summary.condiment += record.condiment;
                    categories.department[ record.cate_no ].summary.discount += record.discount;
                    categories.department[ record.cate_no ].summary.surcharge += record.surcharge;
                    categories.department[ record.cate_no ].summary.service_charge += record.service_charge;
                    categories.department[ record.cate_no ].summary.included_service_charge += record.included_service_charge;
                    categories.department[ record.cate_no ].summary.tax += record.tax;
                    categories.department[ record.cate_no ].summary.included_tax += record.included_tax;

                    if (record.sale_unit != 'unit') {
                        if (categories.department[ record.cate_no ].summary.unit != record.sale_unit) {
                            if (categories.department[ record.cate_no ].summary.unit == 'unit') {
                                categories.department[ record.cate_no ].summary.unit = record.sale_unit;
                            }
                            else {
                                categories.department[ record.cate_no ].summary.multiple_sale_unit = true;
                            }
                        }
                    }
                }
                categories.department[ record.cate_no ].prodByNo[ record.product_no ] = 1;
            }, this );
            if (GeckoJS.Log.defaultClassLevel.value <= 1) this.log('DEBUG', this.dump(categories,20));

            categories.group =  this._setGroupOrderItem(orderItemRecords, categories.group);
            if (GeckoJS.Log.defaultClassLevel.value <= 1) this.log('DEBUG', this.dump(categories,20));

            // compute gross margin ===============================================> department
            for (let cate_no in categories.department) {
                let summary = categories.department[cate_no].summary;
                summary.gm = (summary.adjusted != 0) ? (summary.gp * 100 / summary.adjusted) : null;
            }

            // compute gross margin ===============================================> group
            for (let group_id in categories.group) {
                let summary = categories.group[group_id].summary;
                summary.gm = (summary.adjusted != 0) ? (summary.gp * 100 / summary.adjusted) : null;
            }

            // insert the zero sales products =====================================> department
            var allProducts = GeckoJS.Session.get('products') || [];
            if ( noSalesProduct == 'show' ) {

                allProducts.forEach( function( p ) {
                    if (!(p.cate_no in categories.department)) {
                        categories.department[ p.cate_no ] = {
                            no: p.cate_no,
                            name: p.cate_no + ' - ' + _('Obsolete'),
                            orderItems: [ p ],
                            summary: {
                                qty: 0,
                                weight: 0,
                                gross: 0.0,
                                item: 0,
                                condiment: 0,
                                discount: 0,
                                surcharge: 0,
                                service_charge: 0,
                                included_service_charge: 0,
                                tax: 0,
                                included_tax: 0,
                                adjusted: 0.0,
                                cost: 0,
                                gp: 0,
                                unit: 'unit',
                                multiple_sale_units: true
                            },
                            prodByNo: {}
                        };
                        categories.department[ p.cate_no ].prodByNo[ p.no ] = 1;
                    }
                    else if (!(p.no in categories.department[ p.cate_no ].prodByNo)) {
                        categories.department[ p.cate_no ].orderItems.push( {
                            product_no: p.no,
                            product_name: p.name,
                            avg_price: 0.0,
                            qty: 0,
                            cost: 0,
                            weight: 0,
                            gross: 0.0,
                            item: 0,
                            condiment: 0,
                            discount: 0,
                            surcharge: 0,
                            service_charge: 0,
                            included_service_charge: 0,
                            tax: 0,
                            included_tax: 0,
                            adjusted: 0.0,
                            gp: 0,
                            unit: 'unit',
                            multiple_sale_units: true
                        } );
                    }
                });
            }

            // insert the zero sales products =====================================> group
            if ( noSalesProduct == 'show' ) {

                // we need insert info to allProducts[] about product linkgroup property
                allProducts = this._setGroupProperty(allProducts);

                // inser insert the zero sales products
                for( var i = 0 ; i< allProducts.length ; i++){

                    for(var j = 0 ; j < allProducts[i].grouplink.length ; j++){

                        var groupID = allProducts[i].grouplink[j].id
                        // if the product doesn't have sales recorder...then inser empty info
                        if (!(allProducts[i].no in categories.group[ groupID ].prodByNo)) {
                            categories.group[ groupID ].orderItems.push( {
                            product_no: allProducts[i].no,
                            product_name: allProducts[i].name,
                            avg_price: 0.0,
                            weight: 0,
                            qty: 0,
                            cost: 0,
                            gross: 0.0,
                            item: 0,
                            condiment: 0,
                            discount: 0,
                            surcharge: 0,
                            service_charge: 0,
                            included_service_charge: 0,
                            tax: 0,
                            included_tax: 0,
                            adjusted: 0.0,
                            gp: 0,
                            unit: 'unit',
                            multiple_sale_units: true
                            } );
                        }
                    }
                    delete allProducts[i].grouplink;
                }
            }

            if (GeckoJS.Log.defaultClassLevel.value <= 1) this.log('DEBUG', this.dump(categories,20));

            //hide unselected categroy
            if(  'department' in selectCategory || 'group' in selectCategory ){

                //============='========================================> hide department
                if('department' in selectCategory){

                   var departmentNo = this._getDepartmentNo(selectCategory.department);

                   for ( var category in categories.department ) {
                        if ( departmentNo.indexOf(category) == -1 )
                            delete categories.department[ category ];
                   }

                }
                 //=====================================================> hide group
                if('group' in selectCategory){

                    var groupID = this._getGroupID(selectCategory.group);

                    for ( var group in categories.group ) {
                        if ( groupID.indexOf(group) == -1 )
                            delete categories.group[ group ];
                    }
                }
            }
            if (GeckoJS.Log.defaultClassLevel.value <= 1) this.log('DEBUG', this.dump(categories,20));

            // hide the no sales department if users want it that way.
            if ( empty_department == 'hide' ) {
                 //=====================================================> hide department
                for ( var category in categories.department ) {
                    if ( categories.department[ category ].summary.qty == 0 &&
                         categories.department[ category ].summary.weight == 0 )
                        delete categories.department[ category ];
                }
                 //=====================================================> hide group
                for ( var group in categories.group ) {
                    if ( categories.group[ group ].summary.qty == 0 &&
                         categories.group[ group ].summary.weight == 0 )
                        delete categories.group[ group ];
                }
            }
            if (GeckoJS.Log.defaultClassLevel.value <= 1) this.log('DEBUG', this.dump(categories,20));
            
            // for sorting ================================================> department
            if ( sortby != 'all' ) {
                for ( var category in categories.department ) {
                    categories.department[ category ].orderItems.sort(
                        function ( a, b ) {
                            a = a[ sortby ];
                            b = b[ sortby ];

                            switch ( sortby ) {
                                case 'avg_price':
                                case 'qty':
                                case 'item':
                                case 'gross':
                                case 'adjusted':
                                case 'cost':
                                    if ( a < b ) return 1;
                                    if ( a > b ) return -1;
                                    return 0;
                                case 'product_no':
                                case 'product_name':
                                    if ( a > b ) return 1;
                                    if ( a < b ) return -1;
                                    return 0;
                            }
                        }
                        );
                }
            }

            // for sorting ================================================> group
            if ( sortby != 'all' ) {
                for ( var category in categories.group ) {
                    categories.group[ category ].orderItems.sort(
                        function ( a, b ) {
                            a = a[ sortby ];
                            b = b[ sortby ];

                            switch ( sortby ) {
                                case 'avg_price':
                                case 'qty':
                                case 'item':
                                case 'gross':
                                case 'adjusted':
                                case 'cost':
                                    if ( a < b ) return 1;
                                    if ( a > b ) return -1;
                                    return 0;
                                case 'product_no':
                                case 'product_name':
                                    if ( a > b ) return 1;
                                    if ( a < b ) return -1;
                                    return 0;
                            }
                        }
                        );
                }
            }

            var total_record = 0;
            var total_cost = 0;
            var total_gross = 0;
            var total_item = 0;
            var total_condiment = 0;
            var total_discount = 0;
            var total_surcharge = 0;
            var total_service_charge = 0;
            var total_included_service_charge = 0;
            var total_tax = 0;
            var total_included_tax = 0;
            var total_adjusted = 0.0;
            var total_weight = 0;
            var total_gp = 0;

            for(var cate in categories){
                for(var obj in categories[cate]){
                    total_record += categories[cate][obj].orderItems.length;
                    total_cost += categories[cate][obj].summary.cost;
                    total_gross += categories[cate][obj].summary.gross;
                    total_item += categories[cate][obj].summary.item;
                    total_weight += categories[cate][obj].summary.weight;
                    total_condiment += categories[cate][obj].summary.condiment;
                    total_discount += categories[cate][obj].summary.discount;
                    total_surcharge += categories[cate][obj].summary.surcharge;
                    total_service_charge += categories[cate][obj].summary.service_charge;
                    total_included_service_charge += categories[cate][obj].summary.included_service_charge;
                    total_tax += categories[cate][obj].summary.tax;
                    total_included_tax += categories[cate][obj].summary.included_tax;
                    total_adjusted += categories[cate][obj].summary.adjusted;
                    total_gp += categories[cate][obj].summary.gp;
                }
            }
            var total_gm = (total_adjusted != 0) ? (total_gp * 100) / total_adjusted : null;

            //set group
            //categories.group = GeckoJS.BaseObject.clone(categories.department);
            if (GeckoJS.Log.defaultClassLevel.value <= 1) this.log('DEBUG', this.dump(categories,20));

            this._reportRecords.head.title = _( 'vivipos.fec.reportpanels.productsales.label' );
            this._reportRecords.head.start_time = start_str;
            this._reportRecords.head.end_time = end_str;
            this._reportRecords.head.terminal_no = terminalNo;

            this._reportRecords.body = categories;

            this._reportRecords.foot.record = total_record;
            this._reportRecords.foot.total_cost = total_cost;
            this._reportRecords.foot.total_gross = total_gross;
            this._reportRecords.foot.total_item = total_item;
            this._reportRecords.foot.total_condiment = total_condiment;
            this._reportRecords.foot.total_discount = total_discount;
            this._reportRecords.foot.total_surcharge = total_surcharge;
            this._reportRecords.foot.total_service_charge = total_service_charge;
            this._reportRecords.foot.total_included_service_charge = total_included_service_charge;
            this._reportRecords.foot.total_tax = total_tax;
            this._reportRecords.foot.total_included_tax = total_included_tax;
            this._reportRecords.foot.total_adjusted = total_adjusted;
            this._reportRecords.foot.total_weight = total_weight;
            this._reportRecords.foot.total_gp = total_gp;
            this._reportRecords.foot.total_gm = total_gm;
            this._reportRecords.foot.unit = saleUnit;
            this._reportRecords.foot.multiple_sale_units = multipleSaleUnits;
        },

        _setGroupProperty: function( allProducts ){

            for(var i = 0; i< allProducts.length ; i++){

                var linkGroups = this.returnProductPlu(allProducts[i].no);

                allProducts[i]['grouplink'] = linkGroups;
            }
            return allProducts;
        },

        _setGroupOrderItem: function( orderItemRecords, group){

            orderItemRecords = this._addGroupLinkpProperty(orderItemRecords);

            orderItemRecords.forEach( function( record ) {

                delete record.OrderItem;

                for(var i = 0; i< record.grouplink.length ; i++){

                    if (!record.grouplink[i]) continue;

                    group[ record.grouplink[i].id ].orderItems.push( record );
                    group[ record.grouplink[i].id ].summary.qty += record.qty;
                    group[ record.grouplink[i].id ].summary.cost += record.cost;
                    group[ record.grouplink[i].id ].summary.weight += record.weight;
                    group[ record.grouplink[i].id ].summary.item += record.item;
                    group[ record.grouplink[i].id ].summary.gross += record.gross;
                    group[ record.grouplink[i].id ].summary.adjusted += record.adjusted;
                    group[ record.grouplink[i].id ].summary.gp += record.gp;
                    group[ record.grouplink[i].id ].summary.condiment += record.condiment;
                    group[ record.grouplink[i].id ].summary.discount += record.discount;
                    group[ record.grouplink[i].id ].summary.surcharge += record.surcharge;
                    group[ record.grouplink[i].id ].summary.service_charge += record.service_charge;
                    group[ record.grouplink[i].id ].summary.included_service_charge += record.included_service_charge;
                    group[ record.grouplink[i].id ].summary.tax += record.tax;
                    group[ record.grouplink[i].id ].summary.included_tax += record.included_tax;
                    group[ record.grouplink[i].id ].prodByNo[ record.product_no ] = 1;

                    let summary = group[ record.grouplink[i].id ].summary;
                    if (!summary.multiple_sale_unit && record.sale_unit != 'unit') {
                        if (summary.unit != record.sale_unit) {
                            if (summary.unit == 'unit') {
                                summary.unit = record.sale_unit;
                            }
                            else {
                                summary.multiple_sale_unit = true;
                            }
                        }
                    }
                }
            }, this );

            return group ;
        },

        _setGroups: function(){

            var groupRecords = [];
            var plugroups = GeckoJS.Session.get('plugroupsById');
            plugroups = GeckoJS.BaseObject.getValues(plugroups);

            for(var i = 0; i< plugroups.length; i++){

                groupRecords.push({ group:{ name:plugroups[i].Plugroup.name, id:plugroups[i].id}, name:plugroups[i].Plugroup.name,id:plugroups[i].id });
            }

            var groups ={};
             groupRecords.forEach( function( categoryRecord ) {
                groups[ categoryRecord.id ] = {
                    no: categoryRecord.id,
                    name: categoryRecord.name,
                    orderItems: [],
                    prodByNo: {},
                    summary: {
                        qty: 0,
                        cost: 0,
                        gross: 0.0,
                        item: 0.0,
                        weight: 0,
                        condiment: 0,
                        discount: 0,
                        surcharge: 0,
                        service_charge: 0,
                        included_service_charge: 0,
                        tax: 0,
                        included_tax: 0,
                        adjusted: 0.0,
                        gp: 0,
                        unit: 'unit',
                        multiple_sale_units: false
                    }
                }
            } );

            return groups;
        },

        _addGroupLinkpProperty: function( orderItemRecords ){

            for(var i =0 ; i< orderItemRecords.length ; i++){

                orderItemRecords[i].grouplink = this.returnProductPlu(orderItemRecords[i].product_no);
            }

            return orderItemRecords;
        },

        _set_reportRecords: function( limit ) {

            limit = parseInt( limit );
            if ( isNaN( limit ) || limit <= 0 ) limit = this._stdLimit;

            var start = document.getElementById( 'start_date' ).value;
            var end = document.getElementById( 'end_date' ).value;

            var terminalNo = document.getElementById( 'terminal_no' ).value;

            var periodType = document.getElementById( 'period_type' ).value;
            var shiftNo = document.getElementById( 'shiftno' ).value;

            var sortby = document.getElementById( 'sortby' ).value;
            var department = document.getElementById( 'department' ).value;

            var empty_department = document.getElementById( 'empty_department' ).value;
            var noSalesProduct = document.getElementById( 'no_sales_product' ).value;
            var selectCategory = {};

            //set department && group
            if(department == 'select'){

                selectCategory.department = GeckoJS.BaseObject.unserialize( GeckoJS.Configure.read('vivipos.fec.settings.rptConfigure.department'));
                selectCategory.group = GeckoJS.BaseObject.unserialize( GeckoJS.Configure.read('vivipos.fec.settings.rptConfigure.group'));
            }
            this._setData( start, end, periodType, shiftNo, sortby, terminalNo, department, empty_department, noSalesProduct, limit, selectCategory );
        },

        exportCsv: function() {
            this._super( this, true );
        },

        linkToSetDepartmentGroup: function(){

            var screenwidth = GeckoJS.Session.get('screenwidth');
            var screenheight = GeckoJS.Session.get('screenheight');
            var aURL = 'chrome://viviecr/content/reports/rpt_setDepartmentGroup.xul';
            var aFeatures = 'chrome,titlebar,toolbar,centerscreen,modal,width=' + screenwidth + ',height=' + screenheight;
            var inputObj = {
                selectedTemplate: "",
                selectedBarcode: ""
            };

            GREUtils.Dialog.openWindow(this.topmostWindow, aURL, _('select_rate'), aFeatures, inputObj);
       },

        returnProductPlu: function( productNumber ){

          // get product ID
           var productId = this.returnProductID( productNumber ) ;

           var groups = [];

           var productLinkGroup = GeckoJS.Session.get('productsIndexesByLinkGroupAll');
           var plugroups = GeckoJS.Session.get('plugroupsById');

           var groupID = GeckoJS.BaseObject.getKeys(productLinkGroup);

           productLinkGroup = GeckoJS.BaseObject.getValues(productLinkGroup);
           plugroups = GeckoJS.BaseObject.getValues(plugroups);

           for(var i=0 ; i< productLinkGroup.length ; i++){

                for(var j=0 ; j<productLinkGroup[i].length ; j++){

                    if(productLinkGroup[i][j] == productId )
                        groups.push( this._getGroupObject( groupID[i] ) );
                }
           }
          if (GeckoJS.Log.defaultClassLevel.value <= 1) this.log('DEBUG', this.dump(groups,20));
           return groups;
        },

        _getGroupObject: function(id){

             var plugroups = GeckoJS.Session.get('plugroupsById');
             plugroups = GeckoJS.BaseObject.getValues(plugroups);

             for(var i=0; i<plugroups.length ; i++){

                 if(plugroups[i].id == id)
                     return plugroups[i];
             }
        },

        returnProductID: function( productNumber ){

            var products = GeckoJS.Session.get('products');

            for(var i = 0 ; i< products.length ; i++){

                 if( products[i].no == productNumber )
                     return products[i].id;
             }
            return false ;
        },

        _getDepartmentNo: function( departments){

            var departmentNo = [];

            departments.forEach(function(department){

                departmentNo.push(department.no);
            });
            return departmentNo ;
        },

        _getGroupID: function( groups){

             var groupID = [];

             groups.forEach(function(group){

                groupID.push(group.id);
            });
            return groupID ;
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
            var excludeCondiment = GeckoJS.Configure.read(this._prefix + '.exclude_condiment') || false;
            var excludeAdjustment = GeckoJS.Configure.read(this._prefix + '.exclude_adjustment') || false;

            document.getElementById( 'start_date' ).value = start;
            document.getElementById( 'end_date' ).value = end;
            document.getElementById( 'exclude_tax' ).checked = excludeTax;
            document.getElementById( 'exclude_svc' ).checked = excludeSVC;
            document.getElementById( 'exclude_condiment' ).checked = excludeCondiment;
            document.getElementById( 'exclude_adjustment' ).checked = excludeAdjustment;

            // set button callback
            var emailBtnObj = document.getElementById('email_pdf');
            emailBtnObj.setAttribute('oncommand', "$do('emailReport', null, 'RptProfitAndLoss');");
        },

        emailReport: function() {
            $do('emailReport', {mode: 'report', title: _( this._prefix + '.label' )}, 'EmailPdf');
        }
    };

    RptBaseController.extend( __controller__ );
    
} )();

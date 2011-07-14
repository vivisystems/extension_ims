<!-- div class="paper" style="overflow:auto;" -->
<div id="printhead">
	<img src="chrome://viviecr/content/skin/images/logo.png" /><br />
</div>
<div id="docbody" class="paper">
	<p class="heading_store">${head.store.name} - ${head.store.branch}</p>
	<p class="heading_store">${head.store.telephone1}</p>

	<div style="float: left;">
		<p class="heading_p">${_( '(rpt)Terminal' ) + ': '}${head.store.terminal_no}</p>
		<p class="heading_p">${_( '(rpt)Clerk' ) + ': '}${head.clerk_displayname}</p>
		<p class="caption">${head.title}</p>
	</div>

	<div style="float: right;">
		<p class="heading_p">&nbsp;</p>
		<p class="heading_p" style="text-align: right;">${_( '(rpt)Printed Time' ) + ': '}${foot.gen_time}</p>
		<p class="caption" style="text-align: right;">${head.start_time} - ${head.end_time}</p>
	</div>
        <table id="condition-table">
            <tr>
                <td class="condition-title"><span class="caption">${queryFormLabel.database_label|escape}</span></td>
                <td align="left" >

                       <span class="heading_p">${queryFormLabel.database|escape}</span>
                </td>
            </tr>
            <tr>
                <td class="condition-title"><span class="caption">${_('(rpt)Condition') + ' - '}</span></td>
                <td align="left" >
                       <span class="caption">${queryFormLabel.terminal_no_label|escape}</span>
                       <span class="heading_p">${queryFormLabel.terminal_no|escape}</span>
                       <span class="caption">${queryFormLabel.shiftno_label|escape}</span>
                       <span class="heading_p">${queryFormLabel.shiftno|escape}</span>
                       <span class="caption">${queryFormLabel.periodtype_label|escape}</span>
                       <span class="heading_p">${queryFormLabel.period_type|escape}</span>
                       <span class="caption">${queryFormLabel.costtype_label|escape}</span>
                       <span class="heading_p">${queryFormLabel.cost_type|escape}</span>
                       <span class="caption">${queryFormLabel.sortby_label|escape}</span>
                       <span class="heading_p">${queryFormLabel.sortby|escape}</span>
                </td>
           </tr>
       </table>

{for category in body.department}
    <table id="body-table">
        <thead>
            <tr>
            	<td colspan="5" class="subtitle">${category.no} - ${category.name}</td>
            </tr>
            <tr class="fields">
                <th style="text-align: center;">${_( '(rpt)Product Number' )}</th>
                <th style="text-align: center;">${_( '(rpt)Product Name' )}</th>
                <th style="text-align: right; border-left: 1px solid gray">${_( '(rpt)Adjusted Sales' )}</th>
                <th style="text-align: right;">${_( '(rpt)Total Cost' )}</th>
                <th style="text-align: right;">${_( '(rpt)Gross Profit' )}</th>
                <th style="text-align: right; border-right: 1px solid;">${_( '(rpt)Gross Margin' )}</th>
                <th style="text-align: right;">${_( '(rpt)Average Net Price' )}</th>
                <th style="text-align: right;">${_( '(rpt)Units Sold' )}</th>
                <th style="text-align: right;">${_( '(rpt)Quantities Sold' )}</th>
                <th style="text-align: right;">${_( '(rpt)Item Sales' )}</th>
                <th style="text-align: right;">${_( '(rpt)Condiment Sales' )}</th>
                <th style="text-align: right;">${_( '(rpt)Item Discount' )}</th>
                <th style="text-align: right;">${_( '(rpt)Item Surcharge' )}</th>
                <th style="text-align: right;">${_( '(rpt)Service Charge' )}</th>
                <th style="text-align: right;">${_( '(rpt)Add-on Tax' )}</th>
                <th style="text-align: right;">${_( '(rpt)Gross Sales' )}</th>
                <th style="text-align: right;">${_( '(rpt)Included Service Charge' )}</th>
                <th style="text-align: right;">${_( '(rpt)Included Tax' )}</th>
            </tr>
        </thead>
        <tbody>
{for item in category.orderItems}
            <tr>
                <td style="text-align: left;">${item.product_no}</td>
                <td style="text-align: left;">${item.product_name}</td>
                <td style="text-align: right; border-left: 1px solid gray">${item.adjusted|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.cost|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.gp|default:0|viviFormatTaxes:true}</td>
{if item.gm == null}
                <td style="border-right: 1px solid;"/>
{else}
                <td style="text-align: right; border-right: 1px solid;">${item.gm.toFixed(2)}%</td>
{/if}
                <td style="text-align: right;">${item.avg_price|default:0|viviFormatTaxes:true}</td>
{if item.sale_unit == 'unit'}
                <td style="text-align: right;">${item.qty|format:0}</td>
                <td/>
{else}
                <td/>
                <td style="text-align: right;">${item.weight|format:0}${item.sale_unit}</td>
{/if}
                <td style="text-align: right;">${item.item|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.condiment|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.discount|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.surcharge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.service_charge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.tax|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.gross|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.included_service_charge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.included_tax|default:0|viviFormatTaxes:true}</td>
            </tr>
{/for}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="2" style="text-align: left;">${_( '(rpt)Records Found' ) + ': '}${category.orderItems.length|format:0}</td>
                <td style="text-align: right; border-left: 1px solid gray">${category.summary.adjusted|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.cost|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.gp|default:0|viviFormatTaxes:true}</td>
{if item.gm == null}
                <td style="border-right: 1px solid;"/>
{else}
                <td style="text-align: right; border-right: 1px solid;">${category.summary.gm.toFixed(2)}%</td>
{/if}
                <td/>   <!-- average price -->
                <td style="text-align: right;">${category.summary.qty|format:0}</td>
{if category.summary.multiple_sale_units || category.summary.weight == 0}
                <td/>
{else}
                <td style="text-align: right;">${category.summary.weight|format:0}${category.summary.unit}</td>
{/if}
                <td style="text-align: right;">${category.summary.item|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.condiment|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.discount|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.surcharge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.service_charge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.tax|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.gross|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.included_service_charge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.included_tax|default:0|viviFormatTaxes:true}</td>
            </tr>
        </tfoot>
    </table>
    <br />
{/for}

{for category in body.group}
    <table id="body-table">
        <thead>
        	<tr>
            	<td colspan="5" class="subtitle">${category.name}</td>
            </tr>
            <tr class="fields">
                <th style="text-align: center;">${_( '(rpt)Product Number' )}</th>
                <th style="text-align: center;">${_( '(rpt)Product Name' )}</th>
                <th style="text-align: right; border-left: 1px solid gray">${_( '(rpt)Adjusted Sales' )}</th>
                <th style="text-align: right;">${_( '(rpt)Total Cost' )}</th>
                <th style="text-align: right;">${_( '(rpt)Gross Profit' )}</th>
                <th style="text-align: right; border-right: 1px solid;">${_( '(rpt)Gross Margin' )}</th>
                <th style="text-align: right;">${_( '(rpt)Average Net Price' )}</th>
                <th style="text-align: right;">${_( '(rpt)Units Sold' )}</th>
                <th style="text-align: right;">${_( '(rpt)Quantities Sold' )}</th>
                <th style="text-align: right;">${_( '(rpt)Item Sales' )}</th>
                <th style="text-align: right;">${_( '(rpt)Condiment Sales' )}</th>
                <th style="text-align: right;">${_( '(rpt)Item Discount' )}</th>
                <th style="text-align: right;">${_( '(rpt)Item Surcharge' )}</th>
                <th style="text-align: right;">${_( '(rpt)Service Charge' )}</th>
                <th style="text-align: right;">${_( '(rpt)Add-on Tax' )}</th>
                <th style="text-align: right;">${_( '(rpt)Gross Sales' )}</th>
                <th style="text-align: right;">${_( '(rpt)Included Service Charge' )}</th>
                <th style="text-align: right;">${_( '(rpt)Included Tax' )}</th>
            </tr>
        </thead>
        <tbody>
{for item in category.orderItems}
            <tr>
                <td style="text-align: left;">${item.product_no}</td>
                <td style="text-align: left;">${item.product_name}</td>
                <td style="text-align: right; border-left: 1px solid gray">${item.adjusted|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.cost|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.gp|default:0|viviFormatTaxes:true}</td>
{if item.gm == null}
                <td style="border-right: 1px solid;"/>
{else}
                <td style="text-align: right; border-right: 1px solid;">${item.gm.toFixed(2)}%</td>
{/if}
                <td style="text-align: right;">${item.avg_price|default:0|viviFormatTaxes:true}</td>
{if item.sale_unit == 'unit'}
                <td style="text-align: right;">${item.qty|format:0}</td>
                <td/>
{else}
                <td/>
                <td style="text-align: right;">${item.weight|format:0}${item.sale_unit}</td>
{/if}
                <td style="text-align: right;">${item.item|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.condiment|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.discount|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.surcharge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.service_charge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.tax|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.gross|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.included_service_charge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${item.included_tax|default:0|viviFormatTaxes:true}</td>
            </tr>
{/for}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="2" style="text-align: left;">${_( '(rpt)Records Found' ) + ': '}${category.orderItems.length|format:0}</td>
                <td style="text-align: right; border-left: 1px solid;">${category.summary.adjusted|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.cost|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.gp|default:0|viviFormatTaxes:true}</td>
{if item.gm == null}
                <td style="border-right: 1px solid;"/>
{else}
                <td style="text-align: right; border-right: 1px solid;">${category.summary.gm.toFixed(2)}%</td>
{/if}
                <td/>   <!-- average price -->
                <td style="text-align: right;">${category.summary.qty|format:0}</td>
{if category.summary.multiple_sale_units || category.summary.weight == 0}
                <td/>
{else}
                <td style="text-align: right;">${category.summary.weight|format:0}${category.summary.unit}</td>
{/if}
                <td style="text-align: right;">${category.summary.item|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.condiment|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.discount|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.surcharge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.service_charge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.tax|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.gross|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.included_service_charge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${category.summary.included_tax|default:0|viviFormatTaxes:true}</td>
            </tr>
        </tfoot>
    </table>
    <br />
{/for}

    <table id="body-table">
        <thead>
            <tr class="fields">
                <th/>
                <th style="text-align: right;">${_( '(rpt)Adjusted Sales' )}</th>
                <th style="text-align: right;">${_( '(rpt)Total Cost' )}</th>
                <th style="text-align: right;">${_( '(rpt)Gross Profit' )}</th>
                <th style="text-align: right;">${_( '(rpt)Gross Margin' )}</th>
                <th style="text-align: right;">${_( '(rpt)Units Sold' )}</th>
                <th style="text-align: right;">${_( '(rpt)Quantities Sold' )}</th>
                <th style="text-align: right;">${_( '(rpt)Item Sales' )}</th>
                <th style="text-align: right;">${_( '(rpt)Condiment Sales' )}</th>
                <th style="text-align: right;">${_( '(rpt)Item Discount' )}</th>
                <th style="text-align: right;">${_( '(rpt)Item Surcharge' )}</th>
                <th style="text-align: right;">${_( '(rpt)Service Charge' )}</th>
                <th style="text-align: right;">${_( '(rpt)Add-on Tax' )}</th>
                <th style="text-align: right;">${_( '(rpt)Gross Sales' )}</th>
                <th style="text-align: right;">${_( '(rpt)Included Service Charge' )}</th>
                <th style="text-align: right;">${_( '(rpt)Included Tax' )}</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="text-align: left;" class="subtitle">${_( '(rpt)Total Records Found' ) + ': '}${foot.record|format:0}</td>
                <td style="text-align: right;">${foot.total_adjusted|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${foot.total_cost|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${foot.total_gp|default:0|viviFormatTaxes:true}</td>
{if item.gm == null}
                <td/>
{else}
                <td style="text-align: right;">${foot.total_gm.toFixed(2)}%</td>
{/if}
                <td style="text-align: right;">${foot.total_qty|format:0}</td>
{if foot.multiple_sale_units || foot.total_weight == 0}
                <td/>
{else}
                <td style="text-align: right;">${foot.total_weight|format:0}${foot.total_unit}</td>
{/if}
                <td style="text-align: right;">${foot.total_item|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${foot.total_condiment|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${foot.total_discount|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${foot.total_surcharge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${foot.total_service_charge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${foot.total_tax|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${foot.total_gross|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${foot.total_included_service_charge|default:0|viviFormatTaxes:true}</td>
                <td style="text-align: right;">${foot.total_included_tax|default:0|viviFormatTaxes:true}</td>
            </tr>
        </tbody>
    </table>
</div>
<br/>

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
                       <span class="caption">${queryFormLabel.periodtype_label|escape}</span>
                       <span class="heading_p">${queryFormLabel.period_type|escape}</span>
                       <span class="caption">${queryFormLabel.costtype_label|escape}</span>
                       <span class="heading_p">${queryFormLabel.cost_type|escape}</span>
                </td>
           </tr>
       </table>
        <table id="body-table">
            <!--caption>${head.title}</caption-->
            <thead>
                <tr>
                    <th style="text-align: left;">${_( '(rpt)Terminal' )}</th>
                    <th style="text-align: left;">${_( '(rpt)Date' )}</th>
                    <th style="text-align: right; border-left: 1px solid gray">${_( '(rpt)Adjusted Sales' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Total Cost' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Gross Profit' )}</th>
                    <th style="text-align: right; border-right: 1px solid gray">${_( '(rpt)Gross Margin' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Item Sales' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Condiment Sales' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Item Discount' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Item Surcharge' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Add-on Service Charge' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Order Discount' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Order Surcharge' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Promotion' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Revalue' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Add-on Tax' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Gross Sales' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Included Service Charge' )}</th>
                    <th style="text-align: right;">${_( '(rpt)Included Tax' )}</th>
                </tr>
            </thead>
            <tbody>
{for detail in body}
                <tr>
                    <td style="text-align: left;">${detail.terminal_no}</td>
                    <td style="text-align: left;">${detail.date}</td>
                    <td style="text-align: right; border-left: 1px solid gray">${detail.AdjustedSales|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.TotalCost|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.GrossProfit|default:0|viviFormatTaxes:true}</td>
{if detail.GrossMargin == null}
                    <td style="border-right: 1px solid gray"/>
{else}
                    <td style="text-align: right; border-right: 1px solid gray">${detail.GrossMargin.toFixed(2)}%</td>
{/if}
                    <td style="text-align: right;">${detail.ItemSales|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.Condiment|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.ItemDiscount|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.ItemSurcharge|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.ServiceCharge|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.OrderDiscount|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.OrderSurcharge|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.Promotion|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.Revalue|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.Tax|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.GrossSales|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.IncludedServiceCharge|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${detail.IncludedTax|default:0|viviFormatTaxes:true}</td>
                </tr>
{/for}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="1">${_( '(rpt)Records Found' ) + ': '}${body.length|default:0|format:0}</td>
                    <td colspan="1" style="text-align:left">${_( '(rpt)Summary' ) + ':'}</td>
                    <td style="text-align: right;">${foot.foot_datas.AdjustedSales|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.TotalCost|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.GrossProfit|default:0|viviFormatTaxes:true}</td>
{if foot.foot_datas.GrossMargin == null}
                    <td"/>
{else}
                    <td style="text-align: right;">${foot.foot_datas.GrossMargin.toFixed(2)}%</td>
{/if}
                    <td style="text-align: right;">${foot.foot_datas.ItemSales|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.Condiment|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.ItemDiscount|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.ItemSurcharge|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.ServiceCharge|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.OrderDiscount|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.OrderSurcharge|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.Promotion|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.Revalue|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.Tax|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.GrossSales|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.IncludedServiceCharge|default:0|viviFormatTaxes:true}</td>
                    <td style="text-align: right;">${foot.foot_datas.IncludedTax|default:0|viviFormatTaxes:true}</td>
                </tr>
            </tfoot>
        </table>
</div>
<!--/div -->

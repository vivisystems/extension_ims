<!-- div class="paper" style="overflow:auto;" -->
<div id="printhead">
	<img src="chrome://viviecr/content/skin/images/logo.png" /><br />
</div>
<div id="docbody" class="paper">


        <h1 align="right" class="caption" style="font">Purchase Order</h1>
        <!--div align="right">Generated By ViViPOS</div-->

        <h2 class="heading_store"><strong>${head.store.name} - ${head.store.branch}</strong></h2>
	<p class="heading_store">${head.store.contact}</p>
	<p class="heading_store">${head.store.address_1}</span></p>
	<p class="heading_store">${head.store.city},${head.store.zip},${head.store.state},${head.store.country}</p>
	<p class="heading_p">&nbsp;</p>

        <div style="float: left;">
            <p class="heading_p">The following number must appear on all invoices,bills </p>
            <p class="heading_p">of lading, and acknowledgements relating to this PO:</p>
            <p class="heading_p"><strong>${_( 'PO No' ) + ': '}${po.no}</strong></p>
        </div>

        <div style="float: right;">
            <p class="heading_p">P.O. Date : ${po.created_date}</p>
        </div>

        <table id="body-table" style="width: 100%;">
            <thead>
                <tr class="fields">
                    <th style="text-align: center;">${_( 'No.' )}</th>
                    <th style="text-align: center;">${_( 'Product Code' )}</th>
                    <th style="text-align: center;">${_( 'Description' )}</th>
                    <th style="text-align: center;">${_( 'UOM' )}</th>
                    <th style="text-align: center;">${_( 'Qty' )}</th>
                    <th style="text-align: center;">${_( 'Unit Price' )}</th>
                    <th style="text-align: center;">${_( 'AMOUNT' )}</th>
                </tr>
            </thead>
            <tbody>
{for detail in body}
            	<tr>
                    <td style="text-align: center;">${detail.seq}</td>
                    <td style="text-align: center;">${detail.no}</td>
                    <td style="text-align: center;">${detail.name}</td>
                    <td style="text-align: center;">${detail.uom}</td>
                    <td style="text-align: center;">${detail.qty}</td>
                    <td style="text-align: center;">${detail.price}</td>
                    <td style="text-align: center;">${detail.total}</td>
                </tr>
{/for}
            </tbody>
            <tfoot>
                <tr>
                    <td>${_( 'TOTAL' ) + ': '}${foot.total|default:0|viviFormatPrices:true}</td>
                </tr>
            </tfoot>
        </table>

        <div style="clear: both">
            <br/>
            <br/>
        </div>

        <div style="float: Left;">
            <p class="heading_p">_______________________</p>
            <p class="heading_p">APPROVED BY</p>
        </div>

        <div style="float: right;">
            <p class="heading_p">_______________________</p>
            <p class="heading_p">DATE</p>
        </div>

        <div style="clear: both">
            <br/>
            <br/>
        </div>
</div>

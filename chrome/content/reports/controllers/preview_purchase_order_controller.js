( function() {
    /**
     * RptCashByClerk Controller
     */
     
    include( 'chrome://viviecr/content/reports/controllers/rpt_base_controller.js' );

    var __controller__ = {
        
        name: 'PreviewPurchaseOrder',
        
        packageName: 'ims',
        
        _fileName: 'purchase_order',
        
        _poData: null,
        
        load: function(data) {
            
            this._poData = data || null;
            
            //this._enableButton( false );
            this._mainScreenWidth = GeckoJS.Configure.read( 'vivipos.fec.mainscreen.width' ) || 800;
            this._mainScreenHeight = GeckoJS.Configure.read( 'vivipos.fec.mainscreen.height' ) || 600;

            // reset report result innerHtml
            var bw = document.getElementById( this._preview_frame_id );
            if (bw) {
                this._rpt_layout_template_src = bw.getAttribute('src') || ""; // set layout template , export pdf will use it.
                var doc = bw.contentWindow.document.getElementById( this._abody_id );
                if (doc) {
                    doc.innerHTML = "";
                }
            }
            
            this._exportedFileName = this._fileName;
            
            // autoexecute
            var self = this;
            setTimeout( function() {
                self.execute();
            }, 100);

            // set button callback
            var emailBtnObj = document.getElementById('email_pdf');
            emailBtnObj.setAttribute('oncommand', "$do('emailReport', null, 'PreviewPurchaseOrder');");
        },        

        emailReport: function() {
            $do('emailReport', {mode: 'po', supplier: this._poData.supplier, id: this._poData.po.no, title: _('Purchase Order')}, 'EmailPdf');
        },

        execute: function() {

            this._stdLimit = parseInt( GeckoJS.Configure.read( "vivipos.fec.settings.reports.stdLimit" ) || this._stdLimit );
            var reportResult = false;
            
            try {
                // Doing so to prevent the timeout dialog from prompting during the execution.
                
                this._enableButton( false );

                var waitPanel = this._showWaitingPanel(100, true);
                this._setTemplateDataHead();
                this._set_reportRecords();
                this._set_queryForm();
                this._setTemplateDataFoot();
                reportResult = this._exploit_reportRecords();
            } catch ( e ) {
                this.log( 'ERROR', GeckoJS.BaseObject.dump( e ) );
            } finally {

                this._enableButton( true );
		        
                if ( waitPanel != undefined )
                    this._dismissWaitingPanel();
            }
        },
        
        _set_reportRecords: function( ) {
            
            this._reportRecords.po = this._poData['po'];
            this._reportRecords.body = this._poData['detail'];
            this._reportRecords.foot.total = this._poData['po']['total'];
            
        }
                      
    };

    RptBaseController.extend( __controller__ );
} )();

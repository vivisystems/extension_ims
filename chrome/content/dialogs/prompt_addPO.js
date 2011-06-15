var promptAddPO_data;

(function(){
   
    /**
     * register promptAddPOPanel
     */
    function startup() {

        var $panel = $('#promptAddPOPanel');

        var screenwidth = GeckoJS.Configure.read('vivipos.fec.mainscreen.width') || 800;
        var screenheight = GeckoJS.Configure.read('vivipos.fec.mainscreen.height') || 600;
        
        $.installPanel($panel[0], {
            
            css: {
                left: 0,
                top: 0,

                width: screenwidth,
                'max-width': screenwidth,

                height: screenheight,
                'max-height': screenheight
            },

            load: function(evt) {

                promptAddPO_data = evt.data;

            },

            shown: function(evt) {
                if (promptAddPO_data.clear) {
                    document.getElementById('promptAddPO-field-suppliers').datasource = promptAddPO_data.suppliers;
                    document.getElementById('promptAddPO-field-suppliers').selection.clearSelection();
                    document.getElementById('promptAddPO-field-suppliers').selectedIndex = -1;
                    document.getElementById('promptAddPO-field-ponumber').value = '';
                    document.getElementById('promptAddPO-field-desc').value = '';
                }
                
                document.getElementById('promptAddPO-field-ponumber').focus();

                promptAddPO_validateForm();
            },

            hide: function (evt) {
                var isOK = typeof evt.data == 'boolean' ? evt.data : false;

                if (isOK && (typeof promptAddPO_data.okCB == 'function')) {
                    var ponumber = document.getElementById('promptAddPO-field-ponumber').value || '';
                    var desc = document.getElementById('promptAddPO-field-desc').value || '';

                    ponumber = ponumber.trim();
                    desc = desc.trim();
                    var supplier = promptAddPO_data.suppliers[promptAddPO_data.supplierIndex];
                    if (ponumber.length > 0 && supplier)
                        promptAddPO_data.okCB(ponumber, desc, supplier.code, promptAddPO_data.scope);
                }
            }

        });

    }

    window.addEventListener('load', startup, false);

})();

// global promptAdditem_validateForm function
function promptAddPO_validateForm() {

    var ponumber = document.getElementById('promptAddPO-field-ponumber').value || '';
    promptAddPO_data.supplierIndex = document.getElementById('promptAddPO-field-suppliers').selectedIndex;

    ponumber = ponumber.trim();

    var validated = (ponumber.length > 0) && (promptAddPO_data.supplierIndex > -1);
    document.getElementById('promptAddPO-ok').setAttribute('disabled', !validated);

}

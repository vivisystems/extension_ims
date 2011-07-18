var promptAddGR_data;

(function(){
   
    /**
     * register promptAddGRPanel
     */
    function startup() {

        var $panel = $('#promptAddGRPanel');

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

                promptAddGR_data = evt.data;

            },

            shown: function(evt) {
                if (promptAddGR_data.clear) {
                    document.getElementById('promptAddGR-field-pos').datasource = promptAddGR_data.POs;
                    document.getElementById('promptAddGR-field-pos').selection.clearSelection();
                    document.getElementById('promptAddGR-field-pos').selectedIndex = -1;
                    document.getElementById('promptAddGR-field-grnumber').value = promptAddGR_data.defaultGR;
                    document.getElementById('promptAddGR-field-desc').value = '';
                }
                
                document.getElementById('promptAddGR-field-grnumber').focus();

                promptAddGR_validateForm();
            },

            hide: function (evt) {
                var isOK = typeof evt.data == 'boolean' ? evt.data : false;

                if (isOK && (typeof promptAddGR_data.okCB == 'function')) {
                    
                    var grnumber = document.getElementById('promptAddGR-field-grnumber').value || '';
                    var desc = document.getElementById('promptAddGR-field-desc').value || '';

                    grnumber = grnumber.trim();
                    desc = desc.trim();
                    var po = promptAddGR_data.POs[promptAddGR_data.poIndex];
                    if (grnumber.length > 0 && po)
                        promptAddGR_data.okCB(grnumber, desc, po, promptAddGR_data.scope);
                }
            }

        });

    }

    window.addEventListener('load', startup, false);

})();

// global promptAdditem_validateForm function
function promptAddGR_validateForm() {

    var grnumber = document.getElementById('promptAddGR-field-grnumber').value || '';
    promptAddGR_data.poIndex = document.getElementById('promptAddGR-field-pos').selectedIndex;

    grnumber = grnumber.trim();

    var validated = (grnumber.length > 0) && (promptAddGR_data.poIndex > -1);
    document.getElementById('promptAddGR-ok').setAttribute('disabled', !validated);

}

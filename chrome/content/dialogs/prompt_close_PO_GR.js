var promptClosePOGR_data;

(function(){
   
    /**
     * register promptClosePOGRPanel
     */
    function startup() {

        var $panel = $('#promptClosePOGRPanel');

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

                promptClosePOGR_data = evt.data;

            },

            shown: function(evt) {
                document.getElementById('promptClosePOGR-caption').value = promptClosePOGR_data.title;

                if (promptClosePOGR_data.closePO)
                    document.getElementById('promptClosePOGR-po').removeAttribute('disabled');
                else
                    document.getElementById('promptClosePOGR-po').setAttribute('disabled', true);
                
                if (promptClosePOGR_data.closeGR)
                    document.getElementById('promptClosePOGR-gr').removeAttribute('disabled');
                else
                    document.getElementById('promptClosePOGR-gr').setAttribute('disabled', true);

                if (promptClosePOGR_data.closePO && promptClosePOGR_data.closeGR)
                    document.getElementById('promptClosePOGR-pogr').removeAttribute('disabled');
                else
                    document.getElementById('promptClosePOGR-pogr').setAttribute('disabled', true);
            }

        });

    }

    window.addEventListener('load', startup, false);

})();

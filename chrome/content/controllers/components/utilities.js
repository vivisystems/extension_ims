(function() {

    var __component__ = {

        name: 'Utility',

        formatPrice: function(price) {
            var precision_prices = GeckoJS.Configure.read('vivipos.fec.settings.PrecisionPrices') || 0;
            var options = {
                decimals: GeckoJS.Configure.read('vivipos.fec.settings.DecimalPoint') || '.',
                thousands: GeckoJS.Configure.read('vivipos.fec.settings.ThousandsDelimiter') || ',',
                places: ((precision_prices>0)?precision_prices:0)
            };
            return GeckoJS.NumberHelper.format(price, options);
        }

    }

    var UtilityComponent = window.UtilityComponent = GeckoJS.Component.extend(__component__);

})();


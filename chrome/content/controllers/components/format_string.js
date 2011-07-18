(function() {

    var __component__ = {

        name: 'FormatString',

        autoGenString: function(format, model) {
            var today = new Date().toString('yyyyMMdd');
            var globalCount = model.findCount();
            var todayCount = model.findCount('strftime( "%Y%m%d", "' + model.table + '"."created" ' + ', "unixepoch", "localtime" ) = "' + today + '"');

            if (format != null && format.length > 0) {
                return $.vsprintf([format, today, ++globalCount, ++todayCount]);
            }
            else {
                return null;
            }
        }

    }

    var FormatStringComponent = window.FormatStringComponent = GeckoJS.Component.extend(__component__);

})();

var options;

(function(){
    var inputObj = window.arguments[0];
    var product = (inputObj == null) ? '' : inputObj.product;
    /**
     *  Startup
     */
    function startup() {

        document.getElementById('detail-product').setAttribute("value", product);
        doSetOKCancel(
            function(){
                inputObj.qty = document.getElementById('qty').value;
                inputObj.price = document.getElementById('price').value;
                inputObj.cost = document.getElementById('cost').value;
                inputObj.ok = true;
                return true;
            },
            function(){
                inputObj.ok = false;
                return true;
            }
        );
        validateInput() ;

        document.getElementById('qty').focus();
    };

    function gotFocus() {
        var focusedElement = document.commandDispatcher.focusedElement;
        if (focusedElement.tagName == 'html:input' || focusedElement.tagName == 'textbox') {
            focusedElement.select();
        }
        return true;
    };

    window.addEventListener('load', startup, false);

    // make inputObj globally available
    options = inputObj;
})();


function clearFocusedElement(target) {
    var focused;
    if (target) {
        focused = document.getElementById(target);
    }
    if (!focused) focused = document.commandDispatcher.focusedElement;
    if (focused.tagName == 'html:input' || focused.tagName == 'textbox') focused.value = '';
}

function validateInput(field) {
    
    var qty = document.getElementById('qty').valueNumber;
    var price = document.getElementById('price').valueNumber;
    var cost = document.getElementById('cost').valueNumber;
    var precision = options.precision;

    switch(field) {
        case 'qty':
        case 'price':
            cost = qty * price;
            document.getElementById('cost').value = cost;
            break;

        case 'cost':
            if (qty > 0) {
                price = Math.round(cost / qty, precision);
                document.getElementById('price').value = price;
            }
    }

    if (qty > 0) {
        document.getElementById('ok').removeAttribute('disabled');
    }
    else {
        document.getElementById('ok').setAttribute('disabled', true);
    }
}
window.pubSub = (function() {
    var arrFn = {};
    var subscribe = function(topic, fn) {
        if (typeof arrFn[topic] === 'undefined') {
            arrFn[topic] = [];
        }
        arrFn[topic].push(fn);
    }

    var publish = function(topic, data, ctx) {
        if (arrFn[topic]) {
            for (var i in arrFn[topic]) {
                if (arrFn[topic].hasOwnProperty(i)) {
                    arrFn[topic][i].call((ctx || window), data);
                }
            }
        }
    }

    return {
    	sub : subscribe,
    	pub : publish
    }

})();
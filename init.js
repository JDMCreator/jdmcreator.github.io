;(function(){
	var cache = {};
	window.requireScript = function(src) {
	    if(cache[src] === true){
		return new Promise(function(resolve){resolve()});
	    }
	    else if(cache[src]){
		return cache[src];
	    }
	    cache[src] = new Promise(function (resolve, reject) {
	        var s;
		cache[src] = true;
	        s = document.createElement('script');
	        s.src = src;
		s.type = "text/javascript";
	        s.onload = resolve;
	        s.onerror = reject;
	        document.head.appendChild(s);
	    });
	    return cache[src];
	}
})();
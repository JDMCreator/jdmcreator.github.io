/* Fix for `vh` issue in mobile */
/* Adapted from https://css-tricks.com/the-trick-to-viewport-units-on-mobile/ */
(function(){
	var throttled = false,
	setVH = function(){
		if(!throttled){
			throttled = true;
			setTimeout(function(){throttled = false}, 100);
			document.documentElement.style.setProperty("--bg-vh", window.innerHeight + "px");
		};
	};
	window.addEventListener("resize", setVH);
	setVH();	
})();
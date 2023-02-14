/* xlsx.js (C) 2013-present SheetJS -- http://sheetjs.com */
importScripts('xlsx.full.min.js');
postMessage({t:"ready"});

onmessage = function (evt) {
  var workbook;
  try {
    workbook = XLSX.read(evt.data.d, {type: evt.data.b,cellDates:true});
    // Now we convert it to HTML and send it back
    var results = [];
    workbook.SheetNames.forEach(function(sheetName) {
	if(evt.data.m || evt.data.c){
	var sheet = workbook.Sheets[sheetName];
		for(var i in sheet){
			if(sheet.hasOwnProperty(i) && i[0] != "!"){
				if(sheet[i].t == "n"){
					var n = sheet[i].w;
					if(evt.data.c){
						n = n.replace(/,/g,".").replace(/\.(?=[^\.]*$)/g,",").replace(/\./g,"");
					}
					sheet[i].w = n;
				}
			}
		}
	}
	var htmlstr = XLSX.write(workbook, {sheet:sheetName, type:'string', bookType:'html'});
	results.push({name:sheetName, html : htmlstr}); 
   });
postMessage({t:"xlsx", d:JSON.stringify({results:results})});
  } catch(e) { postMessage({t:"e",d:e.stack||e}); }
  close();
};
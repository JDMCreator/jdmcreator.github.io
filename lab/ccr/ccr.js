(function(){
	var actualArticle = "";
const myMap=new Map();
myMap.set('I', 1);
myMap.set('V', 5);
myMap.set('X', 10);
myMap.set('L', 50);
myMap.set('C', 100);
myMap.set('D', 500);
myMap.set('M', 1000);

var romanToInt = function(s) {
   var result=0;
   if(s){
     var s1=s.split('');
     s1.forEach(function(e,i){
          result += myMap.get(e) < myMap.get(s1[i+1]) ? -myMap.get(e) : myMap.get(e);  // used ternary oprator with '-' where required
     });
   }
   return result; //move it outside loop
}
function cureText(el){
	el = el.cloneNode(true);
	var text = "";
	for(var j=0,c;j<el.childNodes.length;j++){
		c=el.childNodes[j]
		if(c.nodeType == 3){
			text += c.data;
		}
		else if(c.nodeType == 1){
			if(c.classList.contains("wb-invisible")){
				continue;
			}
			else if(c.classList.contains("DefinitionRef")){
				text+=c.innerHTML;
			}
			else if(c.classList.contains("DefinedTerm") && c.closest("dd")){
				text += "<dfn style=\"font-weight:bold;\">"+c.innerText+"</dfn>";
			}
			else if(c.classList.contains("Repealed")){
				text += "<span style=\"color:#600\" class=\"repealed\">"+c.innerHTML+"</span>";
			}
			else if(c.classList.contains("otherLang")){
				text+="<i>"+c.innerHTML+"</i>";
			}
			else if((c.classList.contains("DefinedTermLink") && c.lang ) || c.classList.contains("DefinedTerm")){
				text+="<em>"+c.innerHTML+"</em>";
			}
			else if(c.tagName == "EM"){
				text += "<i>"+c.innerHTML+"</i>";
			}
			else if(c.tagName == "CITE" && c.firstElementChild && c.firstElementChild.href){
				text += "<a href=\""+c.firstElementChild.href+"\">"+c.firstElementChild.innerHTML+"</a>";
			}
			else if(c.tagName == "A"){
				if(c.innerText.indexOf("*") < 0){
					text += "<a href=\""+c.href+"\">"+c.innerHTML+"</a>";
				}
			}
			else{
				console.log(o.number+"|"+c.className+"|"+c.tagName);
			}
		}
	}
	return text;
}
	function getContent(div)
	{
		for(var i=0;i<div.childNodes.length;i++){
			if(div.childNodes[i].nodeType == 1){
				cure(div.childNodes[i]);
			}
		}
		var remove = Array.from(div.querySelectorAll("[data-remove]"));
		for(var i=0;i<remove.length;i++){
			remove[i].parentNode.removeChild(remove[i]);
		}
		return div.innerHTML.replace(/(<p[^>]*>)\s*\&nbsp;/g,"$1").replace(/’/g,"'")
		.replace(/<\s*ul\s*/gi, "<ol ").replace(/<\s*\/\s*ul\s*>/gi, "</ol>")
		.replace(/<li>\&nbsp;(?:\&nbsp;|)(?:\&nbsp;|)/g,"<li>");
	}
	function cure(el){
		var remove = false;
		if(el.tagName == "STRONG"){
			if(el.querySelector(".sectionLabel")){
				remove = true;
			}
		}
		if(el.tagName == "A"){
			el.setAttribute("href", el.href);
		}
		else if(el.tagName == "DT"){
			el.style.display = "none";
		}
		else if(el.tagName == "DD"){
			el.style.marginLeft = "15pt";
			if(el.querySelector("p")){
				el.querySelector("p").style.textIndent = "-15pt";
			}
		}
		if(el.classList.contains("wb-invisible")){
			remove = true;
		}
		if(el.classList.contains("MarginalNote") || el.classList.contains("MarginalNoteDefinedTerm")){
			if(el.querySelector(".wb-invisible")){
				el.removeChild(el.querySelector(".wb-invisible"));
			}
			if(el.nextElementSibling){
				var strong = document.createElement("strong");
				strong.innerHTML="["+cureText(el).trim()+"]";
				if(el.nextElementSibling.classList.contains("Section")){
					var before = el.nextElementSibling.firstElementChild.nextSibling;
					before.parentElement.insertBefore(strong, before);
				}
				else if(el.nextElementSibling.tagName == "UL"){
					var before = el.nextElementSibling.querySelector("a.lawLabel").nextSibling;
					before.parentElement.insertBefore(strong, before);
				}
				else{
					var before = el.nextElementSibling.nextSibling;
					el.parentElement.insertBefore(strong, before);
				}
				remove = true;
			}
			else{
				console.error("No next element after marginal note : "+actualArticle);
			}
		}
		if(el.classList.contains("lawLabel")){
			remove = true;
			if(el.innerText.indexOf(".") > -1 || /\S\s+\S/g.test(el.innerText)){
				el.closest("li").setAttribute("data-list-unique", el.innerText.replace(/^\(/gi, "").replace(/\)$/gi,""));
			}
			if(/\S\s+\S/g.test(el.innerText)){
				var nextLi = el.closest("li");
				while(nextLi = nextLi.nextElementSibling){
					if(nextLi.tagName == "LI"){
						var nextArticle = nextLi.querySelector(".lawLabel");
						if(nextArticle){
							if(nextArticle.innerText.indexOf(".") < 0){
								var art = /([^\s\)\(]+)[\s\)\(]+$/.exec(nextArticle.innerText)[1];
								if(/[xvilc]/i.test(art[0])){
									nextLi.value = romanToInt(art.toUpperCase());
									break;
								}
								else if(/^[0-9]+$/.test(art)){
									nextLi.value = art;
									break;
								}
								else{
									console.error("Next li : "+art);
								}
							}
						}
					}
				}
			}
		}

		else if(el.classList.contains("DefinedTerm") && el.closest("dd")){
			el.style.fontWeight = "bold";
		}
		else if(el.classList.contains("Repealed")){
			el.style.color = "#600"
			el.innerHTML = " "+el.innerHTML;
		}
		else if(el.classList.contains("otherLang")){
			el.style.fontStyle = "italic";
		}
		else if(el.classList.contains("DefinedTermLink") && el.lang){
			el.style.fontStyle = "italic";
		}
		if(el.tagName == "LI"){
			var para = el.firstElementChild;
			if(para && (para.classList.contains("MarginalNote") || para.classList.contains("MarginalNoteDefinedTerm"))){
				para = para.nextElementSibling;
			}
			if(para && para.tagName == "P"){
				var frag = document.createDocumentFragment();
				while(para.firstChild){
					frag.appendChild(para.firstChild);
				}
				el.replaceChild(frag,para);
			}
		}
		if(el.tagName == "UL" && el.querySelector(".lawLabel")){
			var format = el.querySelector(".lawLabel");
			var fc = /[a-z0-9]+/i.exec(format.innerText)[0];
			var form = "";
			var type = "";
			type = fc;
			var lat = {
					"i" : 1,
					"ii" : 2,
					"iii" : 3,
					"iv" : 4,
					"v" : 5,
					"vi" : 6,
					"vii" : 7,
					"viii" : 8,
					"ix" : 9,
					"x" : 10
				}
			if(lat[fc]){
				form = "($#)";
				var start = lat[fc];
				if(start > 1){
					el.setAttribute("start", start);
				}
				type = "i";
			}
			else if(/[a-z]/.test(fc)){
				form = "$#)";
				if(format.innerText.trim()[0] == "("){
					form = "("+form;
				}
				var start = fc.charCodeAt(0) - 97 + 1;
				if(start != 1){el.setAttribute("start", start)}
				type = "a";
			}
			else if(fc == "A" || fc == "B"){
				form = "($#)";
				if(fc == "B"){
					el.start = 2;
				}
				type = "A";
			}
			else if(lat[fc.toLowerCase()]){
				form = "($#)";
				var start = lat[fc.toLowerCase()];
				if(start > 1){
					el.setAttribute("start", start);
				}
				type = "I";
			}
			else if(fc == "1"){
				form = "($#)";
				if(format.innerText != "(1)"){
					console.log(actualArticle+"|"+format.innerText);
				}
			}
			else{
				console.log(fc+"|"+actualArticle+"|"+format.innerText);
			}
			el.setAttribute("data-list-format", form);
			el.setAttribute("data-list-type", type);
		}
		if(!remove){
			for(var i=0;i<el.childNodes.length;i++){
				if(el.childNodes[i].nodeType == 1){
					cure(el.childNodes[i]);
				}
			}
		}
		else{
			el.setAttribute("data-remove", "true");
		}
		el.removeAttribute("class");
		el.removeAttribute("id");
	}
	var a = [];
	var mn = Array.from(document.querySelectorAll("section.intro + section > .MarginalNote, section.intro + section > .MarginalNoteDefinedTerm"));
	var div = document.createElement("div");
	for(var i=0,m;i<mn.length;i++){
		m = mn[i];
		var o = {};
		var text = "";
		var numberElement = m.nextElementSibling.querySelector(".sectionLabel");
		o.number = numberElement.innerText;
		for(var j=0,c;j<m.childNodes.length;j++){
			c=m.childNodes[j]
			if(c.nodeType == 3){
				text += c.data;
			}
			else if(c.nodeType == 1){
				if(c.classList.contains("wb-invisible")){
					continue;
				}
				else if(c.classList.contains("DefinitionRef")){
					text+=c.innerHTML;
				}
				else if(c.classList.contains("DefinedTerm") && c.closest("dd")){
					text += "<dfn style=\"font-weight:bold;\">"+c.innerText+"</dfn>";
				}
				else if(c.classList.contains("Repealed")){
					text += "<span style=\"color:#600\" class=\"repealed\">"+c.innerHTML+"</span>";
				}
				else if(c.classList.contains("otherLang")){
					text+="<i>"+c.innerHTML+"</i>";
				}
				else if((c.classList.contains("DefinedTermLink") && c.lang ) || c.classList.contains("DefinedTerm")){
					text+="<em>"+c.innerHTML+"</em>";
				}
				else if(c.tagName == "EM"){
					text += "<i>"+c.innerHTML+"</i>";
				}
				else if(c.tagName == "CITE" && c.firstElementChild && c.firstElementChild.tagName == "A"){
					text += "<a href=\""+c.firstElementChild.href+"\">"+c.firstElementChild.innerHTML+"</a>";
				}
				else{
					console.log(o.number+"|"+c.className);
				}
			}
		}
		var sibling = m,
		historical = null;
		div.innerHTML = "";
		iL: do{
			if(sibling.classList.contains("HistoricalNote")){
				historical = sibling;
				break iL;
			}
			else{
				div.appendChild(sibling.cloneNode(true));
			}
		}while(sibling = sibling.nextElementSibling)
		//numberElement.parentElement.parentElement.insertBefore(m,numberElement.parentElement.nextSibling);
		var items = historical.querySelectorAll(".HistoricalNoteSubItem");
		var historicalText = [];
		for(var h=0;h<items.length;h++){
			historicalText.push(items[h].innerText);
		}
		historicalText.reverse();
		o.historical = historicalText.join("; ");
		actualArticle = o.number;
		o.content = getContent(div);
		o.title = text;
		div.innerHTML = text;
		o.titleText = div.innerText;
		a.push(o);
	}
	console.log("call("+JSON.stringify({articles:a})+");");
	return a;
})();
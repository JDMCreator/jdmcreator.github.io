(function(){
	"use strict";
	var getTexFromCell = function(cell){
		if(!cell || !cell.cell){return "";}
		var latex = generateFromHTML(this.getHTML(cell.cell));
		if(latex.indexOf("\\\\") >= 0){
			latex = latex.replace(/\s*\\{2}\s*/g, "\\\n");
		}
		return latex;
	},
	completeBorder = function(o){
		var arr = o.borders || [o];
		for(var i=0;i<arr.length;i++){
			var bd = arr[i];
			if(!bd && o.borders){
				o.borders[i] = {type:"none"}
				bd = o.borders[i];
			}
			if(!bd.rowSpan){delete bd.rowSpan}
			var color = toRGBA(bd.color || "#000000");
			color = "#" + ((1 << 24) + (color[0] << 16) + (color[1] << 8) + 							color[2]).toString(16).slice(1);
			var type = bd.type;
			var th = "0.4pt";
			if(bd.ignore || type == "none"){
				bd.text = "none";
				continue;
			}
			if(type == "toprule" || type == "bottomrule"){
				th = "0.08em";
			}
			else if(type == "midrule"){
				if(o.complete){
					th = "0.05em";
				}
				else{
					th = "0.03em";
				}
			}
			var str = "";
			if(color == "#000000"){color = false}
			if(type == "dottedline" || type == "hdashline"){
				str = "(";
				if(color){ str += "paint:rgb(\"" + color + "\")," }
				str += "thickness: 0.4pt, dash: \""+(type == "dottedline" ? "dotted" : "dashed") +"\")";
			}
			else{
				str+= th+ (color? " + rgb(\"" + color + "\")" : ""); 
			}
			bd.text = str;
		}
		return o;
	},
	getBorders = function(matrix){
		var rtnBorder = function(o){return o;}
		var toprule = completeBorder(this.HBorder(0,rtnBorder,matrix));
		var borders = [toprule];
		var hborders = [toprule];
		var vborders = [];
		for(var i=0;i<matrix.length;i++){
			var subborder = [];
			var row = matrix[i];
			var hborder = completeBorder(this.HBorder(i+1,rtnBorder,matrix));
			for(var j=0;j<row.length;j++){
				var cell = row[j];
				var undercell = (matrix[i+1] || [])[j]
				var isRowSpan = cell.refCell && cell.refCell.rowSpan > 1;
				cell = cell.refCell||cell;
				if(j===0){
					subborder.push(completeBorder({
						type:cell.leftBorder||"none",
						color:cell.leftBorderColor,
						rowSpan:isRowSpan
					}));
				}
				if(undercell && undercell.refCell && undercell.refCell.rowSpan > 1){
					hborder.borders[j].rowSpan = true;
				}
				j+=cell.colSpan-1;
				for(var k=0;k<cell.colSpan-1;k++){
					subborder.push({type:"none", text:"none", color:"", rowSpan:isRowSpan,colSpan:true,ignore:true});
					if(undercell && undercell.refCell && undercell.refCell.rowSpan > 1){
						hborder.borders[j+k].rowSpan = true;
					}
				}															subborder.push(completeBorder({
					type:cell.rightBorder||"none",
					color:cell.rightBorderColor,
					rowSpan:isRowSpan
				}));
			}
			borders.push(subborder);
			if(i==2){console.log(subborder)}
			vborders.push(subborder);
			borders.push(hborder);
			hborders.push(hborder);
		}

		// We try horizontal/vertical, and by columns. And we see which one would cover the most
		var xlist = {}, ylist = {};
		for(var i=0;i<hborders.length;i++){
			for(var j=0;j<hborders[i].borders.length;j++){
				var bd = hborders[i].borders[j];
				if(bd.ignore || !bd.text){continue;}
				if(!ylist[bd.text]){ylist[bd.text]=0}
				ylist[bd.text]++;
			}
		}
		var finaly = "", finalynb = 0;
		for(var i in ylist){
			if(ylist.hasOwnProperty(i)){
				if(ylist[i] > finalynb){
					finaly = i;
					finalynb = ylist[i];
				}
			}
		}
		for(var i=0;i<vborders.length;i++){
			for(var j=0;j<vborders[i].length;j++){
				var bd = vborders[i][j];
				if(bd.ignore || !bd.text){continue;}
				if(!xlist[bd.text]){xlist[bd.text]=0}
				xlist[bd.text]++;
			}
		}
		var finalx = "", finalxnb = 0;
		for(var i in xlist){
			if(xlist.hasOwnProperty(i)){
				if(xlist[i] > finalxnb){
					finalx = i;
					finalxnb = xlist[i];
				}
			}
		}

		// Now let's draft hborders commands first

		var commands = []
		var actualCommand = false;
		for(var i=0;i<hborders.length;i++){
			actualCommand = false;
			for(var j=0;j<hborders[i].borders.length;j++){
				var bd = hborders[i].borders[j];
				if(bd.rowSpan){continue;}
				if(actualCommand){
					if(bd.text == finaly || actualCommand.stroke != bd.text){
						commands.push(["table.hline("+
							"y: "+actualCommand.y+", "+
							"stroke: "+compareStroke(actualCommand.stroke,finaly)+","+
							(actualCommand.start>0 ?
							" start: "+actualCommand.start+"," : "")+
							" end: "+j+")"]);
						if(bd.text != finaly){
							actualCommand = {
								y:i,
								start:j,
								stroke:bd.text
							}
						}
						else{
							actualCommand = false;
						}
					}
				}
				else{
					if(bd.text != finaly){
						actualCommand = {
							y:i,
							start:j,
							stroke:bd.text
						}
					}
				}
			}
			if(actualCommand){
			commands.push(["table.hline("+
				"y: "+actualCommand.y+", "+
				"stroke: "+compareStroke(actualCommand.stroke,finaly)+","+
				(actualCommand.start>0 ?
				" start: "+actualCommand.start+"," : "")+
				")"]);
			}
			
		}
		var colN = vborders[0].length;
		for(var i=0;i<colN;i++){
			actualCommand = false;
			for(var j=0;j<vborders.length;j++){
				var bd = vborders[j][i];
				if(bd.ignore){continue;}
				if(actualCommand){
					if(bd.text == finalx || actualCommand.stroke != bd.text){
						commands.push(["table.vline("+
							"x: "+actualCommand.x+", "+
							"stroke: "+compareStroke(actualCommand.stroke,finalx)+","+
							(actualCommand.start>0 ?
							" start: "+actualCommand.start+"," : "")+
							" end: "+j+")"]);
						if(bd.text != finalx){
							actualCommand = {
								x:i,
								start:j,
								stroke:bd.text
							}
						}
						else{
							actualCommand = false;
						}
					}
				}
				else{
					if(bd.text != finalx){
						actualCommand = {
							x:i,
							start:j,
							stroke:bd.text
						}
					}
					
				}
			}
			if(actualCommand){
				commands.push(["table.vline("+
					"x: "+actualCommand.x+", "+
					"stroke: "+compareStroke(actualCommand.stroke,finalx)+","+
					(actualCommand.start>0 ?
					" start: "+actualCommand.start+"," : "")+
					")"]);
			}
		}
		var o = {
			hborders: hborders,
			vborders: vborders,
			borders : borders,
			x: finalx,
			y: finaly,
			commands: commands
		}
		return o;
	},
	compareStroke = function(after, before){
		if(after == "none"){return after;}
		var th = "0.4pt", color = 'rgb("#000000")';
		if(after.indexOf("+")>-1){
			th = /^(?:\s*)[^\s\+]+/.exec(after)[0];
			color = /[^\s\+]+(?:\s*)$/.exec(after)[0];
		}
		else if(after.indexOf("(")>-1){
			return after;
		}
		else{
			th = after;
		}
		if(before.indexOf("+")>-1){
			return th + " + "+color;
		}
		else if(before.indexOf("paint")>-1 || color != 'rgb("#000000")'){
			return `(paint: ${color}, dash: "solid", thickness: ${th})`
		}
		else{
			return `(dash: "solid", thickness: ${th})`
		}
	},
	generateFromHTML = function(html, ignoreMultiline, align) {
		align = align || "l";
		var div = document.createElement("div"), hasMultiline;
		div.innerHTML = html;
		var el = div.querySelectorAll("span.latex-equation");
		var eq = []
		for (var i = 0; i < el.length; i++) {
			var text_formula = el[i].innerText || el[i].textContent;
			if(/\S/.test(text_formula)){
				var kbd = document.createElement("kbd");
				eq.push("$" + (el[i].innerText || el[i].textContent) + "$");
				el[i].parentNode.replaceChild(kbd, el[i]);
			}
			else{
				el[i].parentNode.removeChild(el[i]);
			}
		}
		html = div.innerHTML;
		var str = "", kbdcount = 0, ulcount = 0, lastcrcr = -1;
		for(var i=0,c;i<html.length;i++){
			c = html.charAt(i);
			if(c == "<"){
				var inside = html.substring(i, html.indexOf(">", i+1)+1),
				tagname = /^<?\s*\/?\s*([a-z]+)/i.exec(inside)[1].toLowerCase();
				if(/^<?\s*\//.test(inside)){tagname="/"+tagname;}
				if(tagname == "br"){
					hasMultiline = true;
					str += "\\\n";
				}
				else if(tagname == "kbd"){
					str += eq[kbdcount];
					kbdcount++;
				}
				else if(tagname == "span"){
					var div = document.createElement("div");
					div.innerHTML = inside+"</span>";
					div=div.firstChild;
					if(div.className == "tb-footnote"){
						str += "#footnote["+(div.title||"").replace(/[\[\\\#\~\*\_]/g,"\\$0")+"]";
					}
				}
				else if(tagname == "ul"){
					if(ulcount>0){str+="["}
					str += "#list(";
					ulcount++;
				}
				else if(tagname == "li"){
					str += "[";
				}
				else if(tagname == "/li"){
					str += "],";
				}
				else if(tagname == "/ul"){
					str += ")";
					ulcount--;
					if(ulcount>0){str+="]"}
				}
				else if(tagname == "font"){
					var color = /color\s*=\s*["']?\s*([^ "'\s]+)/i.exec(inside);
					if(color){
						color = toRGBA(color[1]);
						color = "#" + ((1 << 24) + (color[0] << 16) + (color[1] << 8) + color[2]).toString(16).slice(1);
						str += "#text(fill: rgb(\""+color+"\"))[";
					}
					else{
						str += "[";
					}
				}
				else if(tagname == "b"){
					str += "*";
				}
				else if(tagname == "u"){
					str += "#underline[";
				}
				else if(tagname == "sup"){
					str += "#super[";
				}
				else if(tagname == "strike"){
					str += "#strike[";
				}
				else if(tagname == "i" || tagname == "/i"){
					str += "_";
				}
				else if(tagname == "/b"){
					str += "*";
				}
				else if(tagname == "/u" || tagname == "/sup" || tagname == "/strike"){
					str += "]";
				}
				else if(tagname == "/font"){
					str += "]"
				}
				i += inside.length-1;
				continue;
			}
			else if(c == "&"){
				var inside = html.substring(i, html.indexOf(";", i+1)+1);
				if(inside == "&nbsp;"){
					str += "~";
				}
				else if(inside == "&lt;"){
					str += "\\<";
				}
				else if(inside == "&amp;"){
					str += "\\&";
				}
				else if(inside == "&quot;"){
					str += '\\"';
				}
				else if(inside == "&gt;"){
					str += ">";
				}
				i += inside.length-1;
			}
			else if(c == "\\"){
				str += "\\\\"; // Will be changed later.
			}
			else if(c == ">"){
				str += ">";
			}
			else if(c == "$" || c == "%" || c == "^" || c == "_" || c == "{" || c == "}" || c == "#" ||
				c == "*" || c == "["){
				str += "\\" + c;
			}
			else if(c == "|"){
				str += "\\|";
			}
			else if(c == "~"){
				str += "\~";
			}
			else{
				str+= c;
			}
		}
		if(str.length == lastcrcr){
			str = str.slice(0,-2);
		}
		str = str.replace(/[ ]{2,}/g, " ");

		return str
	},
	nonASCII = false,
	escapeStr = function(str) {
		if (!str.normalize) {
			return str;
		}
		var newstr = "",
			graph_table = {
				"768": "`",
				"769": "'",
				"770": "^",
				"776": "\"",
				"807": "c ",
				"771": "~",
				"776": "\"",
				"865": "t ",
				"772": "=",
				"775": ".",
				"778": "r ",
				"774": "u ",
				"780": "v ",
				"779": "H ",
				"808": "k ",
				"803": "d ",
				"817": "b ",
			},
			char_table = {
				"338": "OE",
				"339": "oe",
				"198": "AE",
				"230": "ae",
				"216": "O",
				"248": "o",
				"338": "OE",
				"321": "L",
				"322": "l",
				"223": "ss"
			};
		str = str.normalize("NFD");
		var lastchar = "",
			waiting = false;
		for (var i = 0, code, char; i < str.length; i++) {
			var code = str.charCodeAt(i),
				char = str.charAt(i);
			if (waiting) {
				if (char == "i" || char == "j") {
					newstr += "\\";
				}
				newstr += char + "}";
				waiting = false;
				continue;
			}
			waiting = false;
			if (code < 128) {
				newstr += "" + char;
				lastchar = char;
			} else if (graph_table[code.toString()]) {
				var code = graph_table[code.toString()];
				newstr = newstr.slice(0, -1)
				if (code == "t ") {
					newstr += "\\t{";
					if (lastchar == "i" || lastchar == "j") {
						newstr += "\\";
					}
					newstr += lastchar;
					waiting = true;
				} else {
					newstr += "\\" + code;
					if (lastchar == "i" || lastchar == "j") {
						newstr += "\\";
					}
					newstr += lastchar;
				}
			} else if (char_table[code.toString()]) {
				newstr += "\\" + char_table[code.toString()] + "{}";
			} else {
				nonASCII = true;
				newstr += "" + char;
				lastchar = char;
			}
		}
		return newstr
	},
	useRotate = false,
	updateCellInfo = function(cell, isFirst, rule, headerAlign, headerRule){
		var tex = getTexFromCell.call(this, cell), oldtex = tex, expand = arguments.length<5;
		if(headerAlign != cell.alignText){
			cell.customAlign = true;
		}
		return tex;
	},
	getAlign = function(cell){
		var align = {
			"l": "left",
			"c": "center",
			"r": "right"
		}[cell.align] || "left";
		align += " + ";
		align += {
			"t": "top",
			"m": "horizon",
			"b": "bottom"
		}[cell.valign] || "top";
		return align;
	},
	generateHeaderFromMatrix = function(matrix){
		var header = "\\strut\n\\vrule height1ex depth1ex width0px #\n",
		    align = [],
		    bg = [],
		    vrules = [];
		for(var i=0;i<matrix.length;i++){
			var cells = matrix[i];
			for(var j=0;j<cells.length;j++){
				var cell = cells[j];
				if(!cell.ignore){
					if(!align[j]){align[j]={}}
					if(!vrules[j]){vrules[j]={}}
					if(!bg[j]){bg[j]={}}
					var alignValue = getAlign(cell);
					cell.alignText = alignValue;
					if(!align[j][alignValue]){align[j][alignValue]=0}
					align[j][alignValue]++
					var comparable = this.getComparableHeader(cells[j-1],cell,cells[j+((cell.cell||{}).colSpan||1)]),
					rules="";
					if(cells[j-1]){
						rules=comparable.replace(/[a-z]+/ig,"");
					}
					else{
						rules = comparable.replace(/[a-z]+/ig,"%");
					}
					if(!vrules[j][rules]){vrules[j][rules]=0}
					vrules[j][rules]++;

					var cellBackground = "none";
					if(cell.cellBackground){
						var color = cell.cellBackground;
						cellBackground = "rgb(\"#" + ((1 << 24) + (color[0] << 16) + (color[1] << 8) + color[2]).toString(16).slice(1)+"\")";
					}
					cell.cellBackground = cellBackground;
					if(!bg[j][cellBackground]){bg[j][cellBackground]=0}
					bg[j][cellBackground]++;
					cell.update = updateCellInfo.bind(this, cell, !cells[j-1], rules);
				}
			}
		}
		var finalalign = [],
		actufinalalign = 0, actufinalalignnb=0;
		for(var i=0;i<align.length;i++){
			for(var j in align[i]){
				if(align[i].hasOwnProperty(j)){
					if(align[i][j] > actufinalalignnb){
						actufinalalign = j;
						actufinalalignnb = align[i][j]
					}
				}
			}
			finalalign.push(actufinalalign);
			actufinalalign = actufinalalignnb = 0;
		}
		var finalvrules = [],
		actufinalvrules = "", actufinalvrulesnb=0;
		for(var i=0;i<vrules.length;i++){
			for(var j in vrules[i]){
				if(vrules[i].hasOwnProperty(j)){
					if(vrules[i][j] > actufinalvrulesnb){
						actufinalvrules = j;
						actufinalvrulesnb = vrules[i][j]
					}
				}
			}
			finalvrules.push(actufinalvrules);
			actufinalvrules = "";actufinalvrulesnb = 0;
		}
		var finalbg = [],
		actufinalbg = "", actufinalbgnb=0;
		for(var i=0;i<bg.length;i++){
			for(var j in bg[i]){
				if(bg[i].hasOwnProperty(j)){
					if(bg[i][j] > actufinalbgnb){
						actufinalbg = j;
						actufinalbgnb = bg[i][j]
					}
				}
			}
			finalbg.push(actufinalbg);
			actufinalbg = "";actufinalbgnb = 0;
		}
		for(var i=0;i<finalvrules.length;i++){
			header += "&";
			if(i==0 && finalvrules[i] && finalvrules[i].charAt(0) != "%"){
				header+="\\vrule";
			}
			header += "\\kern3pt "
			if(finalalign[i] != "l"){
				header += "\\hfil ";
			}
			header += "#";
			if(finalalign[i] != "r"){
				header += "\\hfil";
			}
			header+="\\kern3pt";
			if(finalvrules[i] && !/^[^%]*%$/.test(finalvrules[i])){
				header += "\\vrule"
			}
			header+= "\n";
		}
		length = finalvrules.length;
		return {header : header,
			bg: finalbg,
			rules : finalvrules,
			align : finalalign};
	},
	length = 0;
	table.createInterpreter("typst", function(){
		var matrix = this.matrix(),
		booktabs = this.element.hasAttribute("data-booktabs"),
                centering = this._id("table-opt-center").checked,
		tab = "  ",
		bc = "\n",
		br = "",
		str = "#table(\n";
		var isHeader = true,
		headerO = generateHeaderFromMatrix.call(this, matrix),
		header = headerO.header,
		headerV = headerO.rules,
		headerA = headerO.align,
		headerBg = headerO.bg;
		str += tab+"columns: "+headerA.length+",\n";
		var borders = getBorders.call(table, matrix);
		var isAllSame = headerA.every(function(el) { return el === headerA[0]; });
		if(isAllSame){
			str+= tab+"align: "+({"l":"left","c":"center","r":"right"}[headerA[0]])+",\n";
		}
		else{
			str+= tab+"align: ("+
				(headerA.join(", ").replace(" + top", ""))
			+ "),\n";
		}
		if(borders.x == borders.y){
			str += tab+ "stroke: "+borders.x+",\n";
		}
		else{
			str += `${tab}stroke: (x: ${borders.x}, y: ${borders.y}),\n`
		}
		var isAllSame = headerBg.every(function(el) { return el === headerBg[0]; });
		if(isAllSame && headerBg[0] != "none"){
			str += tab+"fill: "+headerBg[0]+",\n";
		}
		else if(!isAllSame){
			str += tab+"fill: ("+headerBg.join(", ")+"),\n"
		}
		if(borders.commands.length){
			str += tab + borders.commands.join(",\n"+tab)+",\n"; 
		}
		var rg = [];
		for(var i=0, border;i<matrix.length;i++){
			var row = matrix[i],
			rgrow = [];
			for(var j=0;j<row.length;j++){
				var cell = row[j];
				if("ignore" in cell){
					continue;
				}
				else{
					var data = cell.update(headerA[j],headerV[j]),
					colspan = (cell.cell||cell.refCell.cell).colSpan,
					cellO = {},
					content = "";
					j+=colspan-1;
					if(colspan>1){
						cellO.colspan = cell.colSpan;
						content = cell.update(true);
					}
					else{
						content = data;
					}
					if(cell.rowSpan > 1){
						cellO.rowspan = cell.rowSpan;
					}
					if(cell.customAlign){
						cellO.align = cell.alignText.replace(
							(/\s+\+[\s\S]+$/.exec(headerA[cell.x])||[""])[0]
						, "").replace(
							(/^[\s\S]+\+\s+/.exec(headerA[cell.x])||[""])[0]
						, "");
					}
					if(cell.cellBackground != headerBg[cell.x]){
						cellO.fill = cell.cellBackground;
					}
					var cellOContent = "";
					for(var k in cellO){
						if(cellO.hasOwnProperty(k)){
							cellOContent += tab + tab + k+": "+ cellO[k]+",\n";
						}
					}
					if(cellOContent){
						content = "table.cell(\n"+cellOContent+")["+content+"]";
					}
					else{
						content = "["+content+"]";
					}
					rgrow.push({text:content, colSpan:colspan});
				}
				
			}
			rg.push(rgrow);
			
		}
		for(var i=0;i<rg.length;i++){
			for(var j=0;j<rg[i].length;j++){
				str += rg[i][j].text+","+bc;
			}
			str += br;
		}
		str += ")"
		if(document.getElementById('opt-tex-escape').checked){
			// We escape the characters in the document
			str = escapeStr(str);
			if(nonASCII){
				this.message("Your generated TeX code still contains non-ASCII characters.", "warning")
			}
		}
		return str;
	})
})();
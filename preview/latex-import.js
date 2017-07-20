(function(){
var latex = {},
   envirn = function(code){
	o = {full: ""}
	var com = command(code);
	if(com.name != "begin"){return false}
	o.command = com;
	var name = com.args[0];
	o.name = name;
	code = code.substring(com.full.length);
	var content = "", commentmode = false;
	for(var i=0, char, sub;i<code.length;i++){
		var char = code.charAt(i),
		sub = code.substring(i);
		if(commentmode && char != "\n"){
			content += char;continue;
		}
		commentmode = false;
		if(char == "\\"){
			if(sub == "\\begin{"){
				var env = envirn(sub);
				content += env.full;
				i += env.full.length - 1;
			}
			else if(sub.lastIndexOf("\\end{"+name+"}",0)===0){
				o.content = content;
				o.full = o.command.full + o.content + "\\end{"+name+"}";
				return o;
			}
			else{
				com = command(sub);
				content += com.full;
				i += com.full.length - 1;
			}
		}
		else if(char == "%"){
			content += "%";
			commentmode = true;
		}
		else{
			content += char;
		}
	}
},
 command=function(code){
	var o ={
		options : [],
		args : [],
		full : "",
		asterisk : false
	}
	var name=/^(\\?(?:[a-z]+|.))/i.exec(code)[1],
	realname = name;
	if(realname.charAt(0) == "\\" && realname.length > 1){
		realname = realname.substring(1);
	}
	var nextchar = code.charAt(name.length);
	if(realname == "verb"){
		code = code.substring(name.length+1);
		var arg = "";
		for(var i=0, char;i<code.length;i++){
			char = code.charAt(i);
			if(char == nextchar){
				o.args.push(arg);
				o.name = realname;
				o.full = "\\verb"+nextchar+arg+nextchar;
				return o;
			}
			else{
				arg += "" + char;
			}
		}
		return false;
	}
	else if(nextchar == "*"){
		o.asterisk = true;
		nextchar = code.charAt(name.length+1);
	}
	if(nextchar!="[" && nextchar!="{" && !/^\s$/.test(nextchar)){
		o.name = realname;
		o.args.push(nextchar);
		o.full="\\"+realname+""+nextchar;
		return o;
	}
	code = code.substring(name.length) + " ";
	var mode = 0, actu = "", nbofbrack=0;
	for(var i=0;i<code.length;i++){
		var char = code.charAt(i);
		if(mode == 0){
			if(char == "["){
				mode = 1;
				actu = "";
			}
			else if(char == "{"){
				mode = 2;
				nbofbrack = 0;
				actu = "";
			}
			else{
				o.name = realname;
				o.full = "\\"+realname+code.substring(0,i);
				return o;
			}
		}
		else if(char == "\\"){
			var fullcommand = command(code.substring(i)).full;
			actu += fullcommand;
			i+=fullcommand.length-1;
		}
		else if(char == "%"){
			var index = code.indexOf("\n", i);
			var toadd = code.substring(i, index);
			actu += toadd;
			i += toadd.length-1;
		}
		else if(mode == 1){
			if(char == "]"){
				mode = 0;
				o.options.push(actu);
			}
			else{
				actu += ""+char;
			}
		}
		else{ // mode 2
			if(char == "}"){
				if(nbofbrack<=0){
					mode = 0;
					o.args.push(actu);
				}
				else{
					nbofbrack--;
					actu += char;
				}
			}
			else if(char == "{"){
				nbofbrack++;
				actu += char;
			}
			else{
				actu += "" + char
			}
		}
	}
},
importTable = function(code){
var tabular = /\\begin{(table|tabular[xy]?\*?)}/g.exec(code);
	if(!tabular){
		return false;
	}
	var type = tabular[1], obj = {}, code2 = code.substring(tabular.index), initEnv = envirn(code2);
	code = initEnv.content;
	if(type == "table"){
		if(/\\begin{(tabular[xy]?)}/.test(code)){
			var caption = code.indexOf("\\caption");
			if(caption >=0){
				caption = command(code.substring(caption));
				o.caption = {}
				o.caption.caption = caption.args[0];
				o.caption.numbered = caption.asterisk;
			}
			tabular = /\\begin{(tabular[xy]?\*?)}/g.exec(code2);
			if(!tabular){
				return false; // Should not happen
			}
			type = tabular[1];
			code2 = code2.substring(tabular.index);
			initEnv = envirn(code2);			
		}
		else{
			tabular = /\\begin{(tabular[xy]?\*?)}/g.exec(code);
			if(!tabular){
				return false;
			}
			type = tabular[1];
			code2 = code.substring(tabular.index);
			initEnv = envirn(code2);
		}
	}
	code = initEnv.content;
	var head;
	if(type == "tabular"){
		head = header(initEnv.command.args[1]);
	}
	else if(type == "tabular*" || type == "tabularx" || type == "tabulary"){
		head = header(initEnv.command.args[2]);
	}
	var count = 0, borderCSS = {
		"normal" : "1px solid black",
		"double" : "2px double black",
		"toprule" : "2px solid black",
		"bottomrule" : "2px solid black",
		"midrule" : "1px solid black",
		"cline" : "1px solid black",
		"cmidrule" : "1px solid black"
	};
	var cellpos = 0, commandmode = false, otherseparator = "",
	table = [[]], cell = "", row = table[0], ignoreSpace = false, actuBorder="", borders = [];
	for(var i=0, c;i<code.length;i++){
		c = code.charAt(i);
		var sub = code.substring(i);
		if(ignoreSpace && /^\s$/.test(c)){
			continue;
		}
		ignoreSpace = false;
		if(c == "\\"){
			if(sub.lastIndexOf("\\begin{",0) === 0){
				var env = envirn(sub);
				cell += env.full;
				i += env.full.length - 1;	
				continue;
			}
			var com = command(sub), name = com.name;
			if(name == "\\" || name == "cr"){
				row.push(cell);
				cell = "";
				table.push([]);
				borders.push(actuBorder);
				actuBorder = "";
				row = table[table.length-1];
				ignoreSpace = true;
				i+=com.full.length-1;
			}
			else if(name == "catcode" && /^\\catcode`\\?.=4/.test(sub)){
				var reg = /^\\catcode`\\?(.)=4/.exec(sub);
				otherseparator = reg[1]
				i+= reg[0].length-1;				
			}
			else if(name == "noalign"){
				if(name.args[0].lastIndexOf("\\hrule",0)===0){
					actuBorder = "normal";
				}
				i+=com.full.length-1;				
			}
			else if(name == "hrule"){
				if(actuBorder == "normal"){
					actuBorder == "double";
				}
				else{
					actuBorder == "normal"
				}
				i+=com.full.length-1;
			}
			else if(name == "toprule" || name == "bottomrule" || name == "midrule"){
				actuBorder = name;
				i+=com.full.length-1;
			}
			else if(name == "cline" || name == "cmidrule"){
				if(!actuBorder){
					if(!actuBorder.push){
						actuBorder = [];
					}
					actuBorder.push([name, com.args[0]]);
				}
				i+=com.full.length-1;
			}
			else{
				cell += com.full;
				i+=com.full.length-1;
			}
			continue;
		}
		else if(c == "&" || c === otherseparator){
			row.push(cell);
			ignoreSpace = true;
			cell = "";
			otherseparator = "";
		}
		else{
			cell += c;
		}
	}
	row.push(cell);
	borders.push(actuBorder);
	for(var i=0;i<table.length;i++){
		var row = table[i];
		for(var j=0;j<row.length;j++){
			setCellO(table, j, i, row[j], head[j])
		}
	}
	// ROWSPAN
	for(var i=0;i<table.length;i++){
		var row = table[i],
		pos = 0;
		for(var j=0;j<row.length;j++){
			var o = row[j];
			if(o.rowSpan && Math.abs(o.rowSpan) != 1){
				if(o.rowSpan < 0){
					var span = Math.abs(o.rowSpan);
					for(var k=i-span+1;k<i+1;k++){
						var row2 = table[k];
						if(row2){
							var pos2 = 0;
							for(var h=0;h<row2.length;h++){
								if(pos2 == pos){
									if(k==i-span+1){
										row2[h] = o;
									}
									else{
										row2[h].remove = true;
										row2[h].refCell = o;
									}
								}
								pos2 += row[h].colSpan || 1;
							}
						}
					}
				}
				else{
					for(var k=1;k<Math.abs(o.rowSpan);k++){
						var row2 = table[i+((o.rowSpan<0 ? -1 : 1) * k)];
						if(row2){
							var pos2 = 0;
							for(var h=0;h<row2.length;h++){
								if(pos2 == pos){
									row2[h].remove = true;
									row2[h].refCell = o;
								}
								pos2 += row[h].colSpan || 1;
							}
						}
					}
				}
			}
			pos += o.colSpan || 1;
		}
	}
	// HORIZONTAL BORDERS
	obj.autoBooktabs = false;
	if(borders){
		if(borders[0] == "toprule" && borders[borders.length-1] == "bottomrule"){
			obj.autoBooktabs = true;
		}
	}
	for(var i=0;i<borders.length;i++){
		var border = borders[i],
		row = table[(i===0) ? 0 : i-1], first = i===0;
		if(obj.autoBooktabs && (i===0 || i===borders.length-1)){
			continue;
		}
		if(!border || !row){continue;}
		if(border == "normal" || border == "double" || border == "midrule" || border == "toprule" || border == "bottomrule"){
			for(var j=0;j<row.length;j++){
				var o = row[j];
				o = o.refCell || o;
				if(first){
					o.dataset.borderTop = border;
					o.css+="border-top:"+borderCSS[border]+";";
				}
				else{
					o.dataset.borderBottom = border;
					o.css+="border-bottom:"+borderCSS[border]+";";
				}
			}
		}
		else if(border.push){
			for(var j=0;j<border.length;j++){
				var subborder = border[j];
				if(subborder[0]  == "cline" || subborder[0] == "cmidrule"){
					var end = subborder[1].split(/-+/),
					start = parseInt(end[0],10)-1;
					end = parseInt(end[1],10)-1,
					pos = 0;
					for(k=0;k<row.length;k++){
						var o = row[k];
						o = o.refCell || o;
						if(pos >= start){
							if(pos <= end){
								if(first){
									o.dataset.borderTop = (subborder[0] == "cline") ? "normal" : "midrule";
									o.css+="border-top:1px solid black;";
								}
								else{
									o.dataset.borderBottom = (subborder[0] == "cline") ? "normal" : "midrule";
									o.css+="border-bottom:1px solid black;";
								}
							}
							else{
								break;
							}
						}
						pos += o.colSpan || 1;
					}
				}	
			}
		}
	}
	var realtable = []
	for(var i=0;i<table.length;i++){
		var realrow = [], row = table[i];
		for(var j=0;j<row.length;j++){
			if(!row[j].remove){
				realrow.push(row[j]);
			}
		}
		realtable.push(realrow);
	}
	obj.cells = realtable;
	//return JSON.stringify(obj, false, "\t");
	return obj;
},
setCellO = function(table, x, y, code, header){
	var o = {html:"", dataset:{}},
	html = getHTML(code,o);
	o.html = html;
	var css = "";
	var span = /\\multicolumn{([0-9]*)}{([^}]+)}/.exec(code);
	if(span){
		header = span[2];
		o.colSpan = parseInt(span[1], 10);
	}
	span = /\\multirow{(-?[0-9]*)}{/.exec(code);
	if(span){
		o.rowSpan = parseInt(span[1], 10);
	}
	// Treat header;
	header = header || "l";
	header = header.replace(/!{\\vrule[^}]*}/g, "|");
	header = header.replace(/[@!]?{[^}]*}/g, "");
	if(header.substring(0,2) == "||"){
		o.dataset.borderLeft = "double";
		css += "border-left: 2px double black;"
	}
	else if(header.charAt(0) == "|"){
		o.dataset.borderLeft = "normal";
		css += "border-left: 1px solid black;"
	}
	else if(header.charAt(0) == ";"){
		o.dataset.borderLeft = "hdashline";
		css += "border-left: 1px dashed black;"
	}
	if(/\|\|$/.test(header)){
		o.dataset.borderRight = "double";
		css += "border-right: 2px double black;";
	}
	else if(header.charAt(header.length-1) == "|"){
		o.dataset.borderRight = "normal";
		css += "border-right: 1px solid black;"
	}
	else if(header.charAt(header.length-1) == ";"){
		o.dataset.borderRight = "hdashline";
		css += "border-right: 1px dashed black;"
	}
	for(var i=0,c;i<header.length;i++){
		c = header.charAt(i);
		if(c == "l" || c == "c" || c == "r"){
			o.dataset.align = c;
			continue;
		}
	}
	if(code.indexOf("\\rotcell") != -1 || code.indexOf("\\begin{sideways}") != -1){
		o.dataset.rotated = "data-rotated";
	}
	o.css = css;
	table[y][x] = o;
},
getHTML = function(code,o){
	o = o || {}
	var html="", commentmode = false;
	for(var i=0, char, sub;i<code.length;i++){
		char = code.charAt(i);
		sub = code.substring(i);
		if(commentmode && char != "\n"){
			continue;
		}
		commentmode = false;
		if(char == "\\"){
			if(sub.lastIndexOf("\\begin{",0) === 0){
				var env = treatEnv(sub);
				html += env.html;
				i += env.env.full.length -1;
			}
			else{
				var com = treatCom(sub);
				html += com.html;
				i += com.command.full.length -1;
			}
		}
		else if(char == "-"){
			if(sub.lastIndexOf("---",0)===0){
				html += "&mdash;"
				i += 2;
			}
			else if(sub.charAt(1) == "-"){
				html += "&ndash;"
				i++			
			}
			else{html += "-"}
			continue;
		}
		else if(char == "%"){
			commentmode = true;
			continue;
		}
		else if(char == "<"){
			html += "&lt;";
		}
		else if(char != "\n" && char != "\t"){
			html += char;
		}
	}
	return html;
},
header = function(head){
	var arr = [], actu = "", inside = 0, foundfirst = false;
	for(var i=0, char;i<head.length;i++){
		char = head.charAt(i);
		if(inside > 0){
			if(char == "}"){
				inside--;
				actu += "}";
			}
			else if(char == "{"){
				inside++;
				actu += "{";
			}
			else if(char == "\\"){
				actu += "\\" + head.charAt(i+1);
				i++;
			}
			else{
				actu += "" + char;
			}
			continue;
		}
		if(char == "{"){
			inside++;
			actu += "}";
		}
		else if(char == "\\"){
			actu += "\\" + head.charAt(i+1);
			i++;
		}
		else if(/^[a-zA-Z]$/.test(char)){
			char = char.toLowerCase();
			char = (char == "c" || char == "r") ? char : "l";
			if(arr.length == 0 && !foundfirst){
				foundfirst = true;
				actu += char
			}
			else{
				arr.push(actu);
				actu = char;
			}
		}
		else{
			actu += char;
		}
	}
	arr.push(actu);
	return arr;
},
treatEnv = function(code){
	var env = envirn(code),
	name = env.name, o = {env : env}, html = ""
	if(name == "verbatism"){
		var div = document.createElement("div");
		div.textContent = div.innerText = env.content;
		html = div.innerHTML;
	}
	else if(name != "comment"){
		html = getHTML(env.content);
	}
	o.html = html;
	return o;
},
graph_table = {
	"`" : 768,
	"'" : 769,
        "\"" : 776,
        "c" : 807,
        "~" : 771,
	"t" : 865,
	"=" : 772,
	"." : 775,
	"r" : 778,
        "u" : 774,
	"v" : 780,
	"H" : 779,
	"k" : 808,
	"d" : 803,
	"b" : 817,
 	"OE" : 338,
	"oe" : 339,
	"AE" : 198,
	"ae" : 230,
	"O" : 216,
	"o" : 248,
	"OE" : 338,
	"L" : 321,
	"l" : 322,
	"ss" : 223
},
treatCom = function(code){
	var o = {},
	html = "";
	var com = command(code),
	topush = ""
	name = com.name
	o.command = com;
	if(name == "textit"|| name == "emph" || name=="textsl"){
		html+="<i>" + getHTML(com.args[0]) + "</i>"; 
	}
	else if(name == "textbf"){
		html+="<b>" + getHTML(com.args[0]) + "</b>";
	}
	else if(name == "emph"){
		html+="<i>" + getHTML(com.args[0]) + "</i>";
	}
	else if(name.lastIndexOf("text",0) === 0 || name == "url" || name == "underline" || name == "part" || name == "chapter" || name == "subsection" || name == "section" ||
		name == "caption"){
		html+= getHTML(com.args[0]);
	}
	else if(name == "TeX" || name == "LaTeX" || name == "%" || name == "}" || name == "{" || name == "_" || name == "#" || name == " " || name == "$" || name == "i" || name == "j"){
		html += name;
	}
	else if(name == "\\" || name == "newline" || name == "linebreak"){
		html += "<br>"
	}
	else if(name == "^"){
		if(com.args.length == 0){
			html += "^";
		}
		else{
			html += com.args[0] + String.fromCharCode(770);
		}
	}
	else if(graph_table[name]){
		if(com.args.length > 0){
			html += com.args[0] + String.fromCharCode(graph_table[name]);
		}
		else{
			html += String.fromCharCode(graph_table[name]);
		}
	}
	else if(name == "hbox"){
		html += getHTML(com.args[0])+"<br>";
	}
	else if(name == "multicolumn" || name == "multirow"){
		html += getHTML(com.args[2]);
	}
	else if(name == "verb"){
		var div = document.createElement("div");
		div.innerText = div.textContent = com.args[0];
		html += div.innerHTML;
	}
	else if(name == "textbar"){html += "|"}
	else if (name == "textbackslash"){html += "\\"}
	else if(name == "textasciitilde"){html += "~"}
	else if(name == "og"){html+="&laquo;"}
	else if(name == "fg"){html+="&raquo;"}
	else if(com.args.length == 1 && name != "label" && name != "ref" && name != "pageref" && name != "phantom" && name != "hspace" && name != "vspace" && name != "rule" && name != "cite"){
		html += getHTML(com.args[0]);
	}
	
	o.html = html;
	return o;
}
if(!table.latex){
	table.latex = {}
}
table.latex.importTable = importTable;
})();
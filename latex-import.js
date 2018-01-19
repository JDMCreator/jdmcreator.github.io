(function(){
var latex = {},
   envirn = function(code){
	var o = {full: ""}
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
			if(sub.lastIndexOf("\\begin{",0)===0){
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
				var com2 = command(sub);
				content += com2.full;
				i += com2.full.length - 1;
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
getLength = function(code){
	// TODO
	var length = "";
	var actu = "";
	for(var i=0;i<code.length;i++){
		var c = code.charAt(i);
		if(c == " " || c == "\\"){
			if(/\s*-?(?:[0-9]*.[0-9]+|[0-9]+)(?:pt|mm|cm|in|ex|em|bp|pc|dd|cc|nd|nc|sp)\s*/i.test(actu)){
				length += actu;
			}
			else if(actu.trim() == "plus" || actu.trim() == "minus"){
				length += actu;
			}
			else if(/\\(baselineskip|baselinestretch|columnsep|columnwidth|evensidemargin|linewidth|normalbaselineskip|oddsidemargin|paperwidth|paperheight|parindent|parskip|tabcolsep|textheight|textwidth|topmargin|unitlength)/.test(actu)){
				length += actu;
			}
		}
	}
},
commandNumbers = {
	multicolumn : 3,
	multirow : 3,
	multirowcell : 2,
	multirowthead : 2,
	tabucline : 1,
	taburowcolors : 2
},
specialSeparators = {
	cmidrule : ["(", ")"],
	taburulecolor : ["|", "|"]
},
 command=function(code){
	var o ={
		options : [],
		args : [],
		sp : [],
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
	else if(realname == "\\"){
		o.asterisk = nextchar == "*";
		o.name = realname;
		o.full = "\\\\"+(o.asterisk ? "*" : "");
		return o;
	}
	else if(nextchar == "*"){
		o.asterisk = true;
		nextchar = code.charAt(name.length+1);
	}
	if(nextchar == "]" || nextchar == "}" || nextchar == "\\"){
		o.name = realname;
		o.full = "\\" + realname +(o.asterisk ? "*" : "");
		return o;
	}
	if(nextchar!="[" && nextchar!="{" && !/^\s$/.test(nextchar) && !commandNumbers[realname]){
		o.name = realname;
		o.args.push(nextchar);
		o.full="\\"+realname+""+(o.asterisk ? "*" : "")+nextchar;
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
			else if(specialSeparators[realname] && char == specialSeparators[realname][0]){
				mode = 3;
				actu = "";
			}
			else if(commandNumbers[realname] && o.args.length < commandNumbers[realname]){
				o.args.push(char);
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
		else if(mode == 3){
			if(char == specialSeparators[realname][1]){
				mode = 1;
				o.sp.push(actu);
			}
			else{
				actu += "" + char;
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
var tabular = /\\begin{(tabu\*?|sidewaystable|table\*?|xtabular|longtable|mpxtabular|tabular[xy]?\*?)}/g.exec(code);
	if(!tabular){
		return false;
	}
	var type = tabular[1], obj = {}, code2 = code.substring(tabular.index), initEnv = envirn(code2);
	code = initEnv.content;
	if(type == "table" || type == "table*" || type == "sidewaystable"){
		if(/\\begin{(tabu\*?|xtabular|longtable|mpxtabular|tabular[xy]?\*?|)}/.test(code)){
			var caption = code.indexOf("\\caption");
			if(caption >=0){
				caption = command(code.substring(caption));
				obj.caption = {}
				obj.caption.caption = caption.args[0];
				obj.caption.numbered = caption.asterisk;
			}
			tabular = /\\begin{(tabu\*?|xtabular|longtable|mpxtabular|tabular[xy]?\*?)}/g.exec(code2);
			if(!tabular){
				return false; // Should not happen
			}
			type = tabular[1];
			code2 = code2.substring(tabular.index);
			initEnv = envirn(code2);			
		}
		else{
			return false;
		}
	}
	code = initEnv.content;
	var head;
	if(type == "tabular" || type == "xtabular" || type == "mpxtabular" || type == "longtable"){
		head = header(initEnv.command.args[1]);
	}
	else if(type == "tabular*" || type == "tabularx" || type == "tabulary"){
		head = header(initEnv.command.args[2]);
	}
	else if(type == "tabu" || type == "tabu*"){
		// Because "tabu" supports "tabu to <dim>" and "tabu spread <dim>", we need to handle these special and rarely used cases
		if(initEnv.command.args.length == 2){
			head = header(initEnv.command.args[1]);
		}
		else{
			var totalbracket = 0;
			head = "";
			for(var i=0,c;i<code.length;i++){
				c = code.charAt(i);
				if(totalbracket>0){
					if(c == "\\"){
						head += c + code.charAt(i+1);
						i++;
					}
					else if(c == "{"){
						head += c;
						totalbracket++;
					}
					else if(c == "}"){
						if(totalbracket <= 1){
							code = code.substring(i+1);
							break;
						}
						head += c;
						totalbracket--;
					}
					else{
						head += c;
					}
				}
				else if(c == "\\"){
					i++;
				}
				else if(c == "{"){
					totalbracket++;
				}
			}
			head = header(head);
		}
	}
	var count = 0, borderCSS = {
		"normal" : "1px solid black",
		"double" : "2px double black",
		"toprule" : "2px solid black",
		"bottomrule" : "2px solid black",
		"midrule" : "1px solid black",
		"cline" : "1px solid black",
		"cdouble" : "2px solid black",
		"cmidrule" : "1px solid black",
		"hdashline" : "1px dashed black",
		"dottedline" : "1px dotted black"
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
			if(name == "\\" || name == "cr" || name == "tabularnewline"){
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
				if(name.args[0].indexOf("\\hrule",0)>-1){
					actuBorder = "normal";
				}
				i+=com.full.length-1;				
			}
			else if(name == "hline" || name == "firsthline" || name == "lasthline" || name == "Xhline"){
				if(actuBorder == "normal"){
					actuBorder = "double";
				}
				else{
					actuBorder = "normal"
				}
				i+=com.full.length-1;
			}
			else if(name == "toprule" || name == "bottomrule" || name == "midrule"){
				actuBorder = name;
				i+=com.full.length-1;
			}
			else if(name == "hdashline" || name == "firsthdashline" || name == "lasthdashline"){
				if(com.options[0]){
					if(parseInt(com.options[0].split(/\//)[0],10)<=1.5){
						actuBorder = "dottedline";
					}
					else{
						actuBorder = "hdashline"
					}
				}
				else{
					actuBorder = "hdashline";
				}
				i+=com.full.length-1;
			}
			else if(name == "tabucline"){
				// TODO : Implement different styles for tabucline (ex : dotted, dashed)
				var span = com.args[0];
				if(span == "-"){
					// Span full row
					actuBorder = "normal";
				}
				else{
					if(!actuBorder){
						if(!actuBorder.push){
							actuBorder = [];
						}
						actuBorder.push(["cline", com.args[0].replace(/^-/,"1-")]);
					}
				}
				i+=com.full.length-1;
			}
			else if(name == "cline" || name == "cmidrule" || name == "cdashline" || name == "Xcline"){
				if(name == "Xcline"){
					name = "cline";
				}
				if(name == "cdashline" && com.options[0]){
					if(parseInt(com.options[0].split(/\//)[0],10) <= 1.5){
						name = "cdottedline";
					}
				}

				if(!actuBorder || actuBorder.push){
					if(!actuBorder.push){
						actuBorder = [];
					}
					actuBorder.push([name, com.args[0]]);
				}
				i+=com.full.length-1;
			}
			else if(name == "hhline"){
				actuBorder = [];
				var hhline = com.args[0], hhlinecomment = false, insidehhline = 0, pos = 1;
				hhlineLoop: for(var j=0, hc;j<hhline.length;j++){
					hc = hhline.charAt(j);
					if(hhlinecomment){
						if(hc == "\n"){
							hhlinecomment = false;
						}
						continue hhlineLoop;
					}
					if(hc == "%"){
						hhlinecomment = true;
					}
					else if(insidehhline > 0){
						if(hc == "\\"){
							j++;
						}
						else if(hc == "{"){
							insidehhline++;
						}
						else if(hc == "}"){
							insidehhline--;
						}
					}
					else if(hc == ">"){
						j++;
						insidehhline = 1;
					}
					else if(hc == "-"){
						actuBorder.push(["cline", pos+"-"+pos]);
						pos++;
					}
					else if(hc == "="){
						actuBorder.push(["cdouble", pos+"-"+pos]);
						pos++;
					}
					else if(hc == "~"){
						pos++;
					}
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
	// REMOVE EMPTY CELL AT THE END
	if(table[table.length-1].length == 1){
		var lastCell = table[table.length-1][0];
		if(/^\s*$/.test(lastCell.html) && (!lastCell.dataset || (!lastCell.borderLeft && !lastCell.borderRight && !lastCell.borderBottom))){
			table.pop();
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
		if(border == "normal" || border == "double" || border == "midrule" || border == "toprule" || border == "bottomrule" || border == "hdashline" || border == "dottedline"){
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
				if(subborder[0]  == "cline" || subborder[0] == "cdouble" || subborder[0] == "cmidrule" || subborder[0] == "cdottedline" || subborder[0] == "cdashline"){
					var end = subborder[1].split(/-+/),
					start = parseInt(end[0],10)-1;
					end = (parseInt(end[1],10)||row.length)-1,
					pos = 0,
					realname = {
						cline : "normal",
						cmidrule : "midrule",
						cdottedline : "dottedline",
						cdashline : "hdashline",
						cdouble: "double"
					}[subborder[0]];
					for(k=0;k<row.length;k++){
						var o = row[k];
						o = o.refCell || o;
						if(pos >= start){
							if(pos <= end){
								if(first){
									o.dataset.borderTop = realname;
									o.css+="border-top:"+borderCSS[realname]+";";
								}
								else{
									o.dataset.borderBottom = realname;
									o.css+="border-bottom:"+borderCSS[realname]+";";
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
	return obj;
},
setCellO = function(table, x, y, code, head){
	var o = {html:"", dataset:{}},
	html = getHTML(code,o);
	o.html = html;
	var css = "";
	var span = /\\multicolumn(?:{[ ]*([0-9]*)[ ]*}|([0-9]))/.exec(code);
	if(span){
		span = command(code.substring(span.index));
		head = header(span.args[1])[0];
		o.colSpan = parseInt(span.args[0], 10);
	}
	span = /\\multirow(?:cell|thead|)(?:[ ]*\[[^\]]*\]|)(?:{[ ]*(-?[0-9]*)[ ]*}|([0-9]))/.exec(code);
	if(span){
		o.rowSpan = parseInt(span[1]||span[2], 10);
	}
	
	// Treat header;
	head = head || "l";
	if(head.substring(0,2) == "||"){
		o.dataset.borderLeft = "double";
		css += "border-left: 2px double black;"
	}
	else if(head.charAt(0) == "|"){
		o.dataset.borderLeft = "normal";
		css += "border-left: 1px solid black;"
	}
	else if(head.charAt(0) == ":"){
		o.dataset.borderLeft = "hdashline";
		css += "border-left: 1px dashed black;"
	}
	else if(head.charAt(0) == ";"){
		o.dataset.borderLeft = "dottedline";
		css += "border-left: 1px dotted black;"
	}
	if(/\|\|$/.test(head)){
		o.dataset.borderRight = "double";
		css += "border-right: 2px double black;";
	}
	else if(head.charAt(head.length-1) == "|"){
		o.dataset.borderRight = "normal";
		css += "border-right: 1px solid black;"
	}
	else if(head.charAt(head.length-1) == ";"){
		o.dataset.borderRight = "dottedline";
		css += "border-right: 1px dotted black;"
	}
	else if(head.charAt(head.length-1) == ":"){
		o.dataset.borderRight = "hdashline";
		css += "border-right: 1px dashed black;"
	}
	o.dataset.align = "l";
	for(var i=0,c;i<head.length;i++){
		c = head.charAt(i);
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
		else if(char == "?" && sub.charAt(1) == "`"){
			html += "&iquest;";
			i++;
		}
		else if(char == "!" && sub.charAt(1) == "`"){
			html += "&iexcl;";
			i++;
		}
		else if(char == "`" && sub.charAt(1) == "`"){
			html += "&ldquo;"
			i++;
		}
		else if(char == "'" && sub.charAt(1) == "'"){
			html += "&rdquo;"
			i++;
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
getHeaderComponent = function(head, i){
	var c = head.charAt(i),
	    next = head.charAt(i+1),
	    
	    o = {char : c, opts : [], args : [], full: c}
	if(c == "*" && next != "{"){
		o.args.push(next);
		o.full += next;
		i++;
		next = head.charAt(i+1);
	}
	if(next == "{" || next == "["){
		var argsN = 0, optsN = 0, actu="",commentmode = false;
		for(var j=i+1, d;j<head.length;j++){
			d = head.charAt(j);
			if(commentmode){
				if(d == "\n" || d == "\r"){
					commentmode = false;
				}
				continue;
			}
			else if(d == "%"){
				commentmode = true;
				continue;
			}
			if(d == "{"){
				argsN++;
			}
			else if(d == "["){
				if(argsN == 0){
					optsN++;
				}
				else{
					actu += d;
				}
			}
			else if(d == "\\"){
				actu += d + head.charAt(j+1);
				j++
			}
			else if(d == "}"){
				if(argsN <= 1 && optsN <= 0){
					o.args.push(actu);
					argsN = optsN = 0;
					actu = "";
				}
				else{
					argsN--;
					actu += d;
				}
			}
			else if(d == "]"){
				if(argsN <=0 && optsN <= 1){
					o.opts.push(actu);
					argsN = optsN = 0;
					actu = "";
				}
				else if(optsN > 0){
					optsN--;
					actu += d;
				}
				else{
					actu += d;
				}
			}
			else if(argsN <= 0 && optsN <= 0){
				o.full += head.substring(i+1, j);
				return o;				
			}
			else{
				actu += d;
			}
		}
	}
	else{
		return o;
	}
	o.full += head.substring(i+1);
	return o;
},
header = function(head){
	var arr=[], actu = "", foundfirst = false, commentmode = false;
	for(var i=0,c;i<head.length;i++){
		c = head.charAt(i),
		info = getHeaderComponent(head, i);
		if(commentmode){
			if(c == "\n" || c == "\r"){
				commentmode = false;
			}
			continue;
		}
		else if(c == "%"){
			commentmode = true;

			continue;
		}
		else if(c == "*" && info.args.length >= 2 && (+info.args[0] || 0) > 0){
			var subpreamble = "";
			for(var j=0;j<info.args[0];j++){
				subpreamble += info.args[1]
			}
			head = head.substring(0, i) + subpreamble + head.substring(i + info.full.length);
			i--;
			continue;
		}
		i += info.full.length - 1;
		if(c == "|" || c == ":"){
			actu += c;
		}
		else if(/[a-zA-Z]/.test(c)){
			c = c.toLowerCase();
			if(c == "x"){
				if(info.opts.length == 1){
					c = (/^[0-9-]/.test(info.opts[0]) ? /([cr])[\s\S]*$/i : /^[\s\S]*([cr])/i).exec(info.opts[0]);
					c = c ? c[1] : "l";
				}
				else{
					c = "l";
				}
			}
			else if(c != "c" && c != "r"){
				c = "l";
			}
			if(foundfirst){
				arr.push(actu);
				actu = c;
			}
			else{
				foundfirst = true;
				actu += c;
			}
		}
		else if(c == ";"){
			if(info.args.length > 0){
				var splitcom = info.args[0].split(/\//)[0];
				if(parseInt(splitcom,10) <= 1.5){
					actu += ";";
					continue;
				}
			}
			actu += ":";
		}
		else if((c == "!" || c == "@") && info.args.length > 0){
			if(info.args[0].indexOf("\\vrule") != -1){
				actu += "|";
			}
			else if(info.args[0].indexOf("\\vdashline") != -1){
				actu += ":";
			}
		}
	}
	if(actu){
		arr.push(actu);
	}
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
	else if(name == "uline" || name == "underline"){
		html+="<u>" + getHTML(com.args[0]) + "</u>";
	}
	else if(name == "url" || name == "underline" || name == "part" || name == "chapter" || name == "subsection" || name == "section" ||
		name == "caption"){
		html+= getHTML(com.args[0]);
	}
	else if(name == "TeX" || name == "LaTeX" || name == "%" || name == "}" || name == "{" || name == "_" || name == "#" || name == " " || name == "$" || name == "i" || name == "j"){
		html += name;
	}
	else if(name == "\\" || name == "newline" || name == "linebreak" || name == "par"){
		html += "<br>"
	}
	else if(name == "P"){
		html += "&para;"
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
	else if(name == "multirowcell" || name == "multirowhead" || name == "textcolor"){
		html += getHTML(com.args[1]);
	}
	else if(name == "verb"){
		var div = document.createElement("div");
		div.innerText = div.textContent = com.args[0];
		html += div.innerHTML;
	}
	else if(name == "textquestiondown"){
		html += "&iquest;";
	}
	else if(name == "textexclamdown"){
		html += "&iexcl;";
	}
	else if(name == "textbar"){html += "|"}
	else if (name == "textbackslash"){html += "\\"}
	else if(name == "textasciitilde"){html += "~"}
	else if(name == "textasciicircum"){html += "^"}
	else if(name == "pounds" || name == "textsterling"){html += "&pound;"}
	else if(name == "og"){html+="&laquo;"}
	else if(name == "fg"){html+="&raquo;"}
	else if(com.args.length == 1 && name != "label" && name != "ref" && name != "pageref" && name != "hhline" && name != "phantom" && name != "hspace" && name != "vspace" && name != "rule" && name != "cite" && name != "cellcolor" && name != "rowcolor"){
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
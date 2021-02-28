//create codemirrors in content scripts

//-requires Codemirror, tested with version 5.33.0
//https://github.com/codemirror/CodeMirror

//-requires chrome-extension-port-communications
//https://github.com/DKCTC/chrome-extension-port-communications


var extCodeMirror = function(opt) {
	//require an options obj and an element, and for that element to be a textarea
	//-will probably add future options like setting the size by default, etc
	if(typeof(opt) != 'object' || !opt.element || !$(opt.element).is('textarea')){
		console.error('>> extCodeMirror: no element or element is not a textarea');
		return false;
	}//if

	//if a mode was not sent or is not a string, or the mode is not htmlmixed, css, or js, use htmlmixed
	if(typeof(opt.mode) != 'string' || !(/(text\/(javascript|css)|htmlmixed)/gi).test(opt.mode)){
		opt.mode = 'htmlmixed';
	}//if
	
	//insert anonymous function into script block, or the custom tags into a style block
	//the passed textarea
	var element = $(opt.element),
		//the value in the textarea
		val = element.val(),
		//obj for selection and config
		selection = {},
		config = {},
		//filter for replacing certain text with other text
		_doReplace = function(cm,query,text,opt){
			//if an opt obj is not sent, set it equal to obj
			(typeof(opt) != 'object') ? opt = {} : '';
			var cursor = cm.getSearchCursor(query,undefined,{caseFold: true, multiline: true}),
				control = 0, match;
			while ( cursor.findNext() && control < 1000 ) {
				control++;
				//if no mode filter was sent, or one was sent and the mode at this position passes through the filter
				//-do the replacement
				if(!opt.mode || (!!opt.mode && !!(opt.mode).test(cm.getModeAt(cursor.from()).name))){
					match = cm.getRange(cursor.from(), cursor.to()).match(query);
					cursor.replace(match[0].replace(query,text));
				}//if
			};//while
			//return success
			return (control > 0);
		},//func
		//insert and anonymous function at cursor location, wrap around selected text
		insertAnonymousFunction = function(cm,name,ev){
			//get the cm obj, cursor info (line, char), and selected text value
			var cursor = cm.getCursor(),
				text = cm.getSelection() || '';
			
			//if this is a script block, wrap the selection with an anonymous function, then fix indentation
			if(cm.getModeAt(cursor).name == 'javascript'){
				cm.replaceSelection('(function($){\n\t\t'+text+'\n\t})(jQuery);','around');
				cm.execCommand('indentAuto');
			}//if
		},//func
		//sample function: toggle case of selected text between original and both title cases
		toggleCaseCM = function(cm,name,ev){
			//if nothing is selected, do nothing
			if(!cm.somethingSelected()){
				return false;
			}
			//get the selection info (text, line, char, length)
			var t = {
				text: cm.getSelection(),
				start: cm.getCursor()
			};
			t.length = t.text.length;
			
			switch(true){
				//if the text has not yet been toggled, or this is different text (different line, char, or length)
				case(selection === false //typeof(selection) == 'undefined'
					|| selection.start.line != t.start.line
					|| selection.start.ch != t.start.ch
					|| selection.len != t.length):
						
					selection = {o:t.text,tc:t.text.toTitleCase(),start:t.start,len:t.length};
					cm.replaceSelection(t.text.toTitleCase(),'around');
				break;
				//if it has been toggled but not to the title case variant, toggle to the title case variant
				case(!selection.tct):
					selection.tct = t.text.toTitleCase(true);
					cm.replaceSelection(t.text.toTitleCase(true),'around');
				break;
				//if there are any lowercase letters at this point, make them all uppercase
				case(!selection.up):
					selection.up = t.text.toUpperCaseText();
					cm.replaceSelection(t.text.toUpperCaseText(),'around');
				break;
				//if there are all uppercase letters at this point, make them all lowercase
				case(!selection.low):
					selection.low = t.text.toLowerCaseText();
					cm.replaceSelection(t.text.toLowerCaseText(),'around');
				break;
				//else go back to the original
				default:
					cm.replaceSelection(selection.o,'around');
					//delete selection;
					selection = false;
				break;
			}//switch
		},//func toggleCaseCM
		//overlays
		//***remember to add it to the block at line ~535 so that it actually gets applied to the codemirror
		overlays = {
			//overlay that highlights unicode quotes
			unicodesinglequote: [{ // ’ \u2019 ‘ \u2018 ‚ \u201A ‛ \u201B “ \u201C ” \u201D „ \u201E ‟ \u201F
				name:'unicodesinglequote',
				token: function(stream, state) {
					//console.debug(stream);
					var re = /(\u2018|\u2019|\u201A|\u201B)/i,
						re_dbl = /(\u201C|\u201D|\u201E|\u201F)/i,
						_class = 'invalid ';
					//console.log('>>> unicodequote match sng: '+stream.match(re)+' | dbl: '+stream.match(re_dbl));
					switch(true){
						//this is a unicode double quote
						case(!!stream.match(re_dbl)):
							return _class+'unicodedoublequote';
						break;
						//this is a unicode single quote
						case(!!stream.match(re)):
							return _class+'unicodesinglequote';
						break;
					}//switch
					//keep advancing the stream until the end of the line, or another match is found
					while (stream.next() != null
						&& !stream.match(re, false)
						&& !stream.match(re_dbl, false)
						) {}
					return null;
				}},{ priority:100 }],
			//overlay that highlights spaces in href attrs in html
			hrefspace: [{
				name:'hrefspace',
				token: function(stream, state) {
					var re = /href=\"([^"]*)(\s)([^"]*)\"/i,
						_class = 'invalid hrefspace',
						//get the mode at the token location
						_mode = CodeMirror.innerMode(stream.lineOracle.doc.mode, stream.lineOracle.doc.cm.getTokenAt({ line:stream.lineOracle.line, ch: stream.start }).state),
						//if it's an anchor, link, or other HTML tags that have href attrs, and not styles or scripts
						isHTML = !!_mode.state && !!_mode.state.tagName
							&& (/(^a$|area|base|link)/i).test(_mode.state.tagName);
					
					switch(true){
						//this is an href with a space in it in a valid html tag
						case(!!stream.match(re) && !!isHTML):
							return _class;
						break;
					}//switch
					//keep advancing the stream until the end of the line, or another match is found
					while (stream.next() != null
						&& !stream.match(re, false)
						) {}
					return null;
				}},{ priority:100 }],
			//highlight internal site links that have target="_blank" on them
			//-assuming that most internal site links should not open in new tabs
			targetblankint: [{
				name:'targetblankint',
				token: function(stream, state) {
					var re = /(?=[^>]*(href="((http(s)*:)*\/\/www\.example\.com|\/(?!\/))[^"]*")[^>]*)(?=[^>]*(target="_blank")[^>]*)(\5.*)*\1(.*\5)*/i,
						//class to add to the text in codemirror
						_class = 'warning targetblankint',
						//get the mode at the token location
						_mode = CodeMirror.innerMode(stream.lineOracle.doc.mode, stream.lineOracle.doc.cm.getTokenAt({ line:stream.lineOracle.line, ch: stream.start }).state),
						//if it's an anchor, link, or other HTML tags that have href attrs, and not styles or scripts
						isHTML = !!_mode.state && !!_mode.state.tagName
							&& (/(^a$)/i).test(_mode.state.tagName);
					
					switch(true){
						//this is an href with a space in it in a valid html tag
						case(!!stream.match(re) && !!isHTML):
							return _class;
						break;
					}//switch
					//keep advancing the stream until the end of the line, or another match is found
					while (stream.next() != null
						&& !stream.match(re, false)
						) {}
					return null;
				}},{ priority:100 }],
			//highlights six-digit repeating hex color codes
			hex6to3: [{
				name:'hex6to3',
				token: function(stream, state) {
					//console.debug(stream);
					var re = /(#)(\w)(\2{5})/i,
						_class = 'warning hex6to3';
					switch(true){
						//this is an img tag with src/data-lazy but with an alt attr that is too short/blank
						case(!!stream.match(re)):
							return _class;
						break;
					}//switch
					//keep advancing the stream until the end of the line, or another match is found
					while (stream.next() != null
						&& !stream.match(re, false)
						) {}
					return null;
				}},{ priority:105 }],
			//highlight photoshop etx characters
			etx: [{
				name:'etx',
				token: function(stream, state) {
					var re = /\u0003/,
						_class = 'invalid etx ';
					//
					switch(true){
						case(!!stream.match(re)):
							return _class;
						break;
					}//switch
					//keep advancing the stream until the end of the line, or another match is found
					while (stream.next() != null
						&& !stream.match(re, false)
						) {}
					return null;
				}},{ priority:111 }],
			//highlight old html tags b u i 8319
			oldhtml: [{
				name:'oldhtml',
				token: function(stream, state) {
					var re = /<(\/*)(b|u|i)>/,
						_class = 'invalid oldhtml ';
					
					switch(true){
						case(!!stream.match(re)):
							return _class;
						break;
					}//switch
					//keep advancing the stream until the end of the line, or another match is found
					while (stream.next() != null
						&& !stream.match(re, false)
						) {}
					return null;
				}},{ priority:101 }],
			//highlight img tags with missing/blank/too short alt attr values for ADA compliance
			//-data-lazy is used by slick.js carousel
			imgtag: [{
				name:'imgtag',
				token: function(stream, state) {
					//is a basic img tag that has a data-lazy or src attr and a missing alt attr
					var re_invalid = /(<img(?!.*?alt=(['"]).*?\2)(.*(data-lazy|src))[^>]*?)(\/?>)/i,
						//is a basic img tag that has a src or data-lazy
						re_imgtag = /<img.*(data-lazy|src)="[^"]*"[^>]*>/i,
						//is an alt attr that is less than 5 characters long
						//-what image are we going to describe well enough with less than 5 characters?
						re_altshort = /\salt="[^"]{0,4}"/i,
						//string for class name
						_class = 'imgtag ';
					switch(true){
						//this is an img tag with src/data-lazy and with no alt attr at all
						case(!!stream.match(re_invalid)):
							return _class+'none invalid';
						break;
						//this is an img tag with src/data-lazy but with an alt attr that is too short/blank
						case(!!stream.match(re_altshort) && !!(re_imgtag).test(stream.string)):
							return _class+'short warning';
						break;
					}//switch
					//keep advancing the stream until the end of the line, or another match is found
					while (stream.next() != null
						&& !stream.match(re_altshort, false)
						&& !stream.match(re_invalid, false)
						) {}
					return null;
				}},{ priority:100 }]
		};//overlays

	//config
	config = {
		name: opt.mode,
		lineNumbers: true,
		//gutter: true,
		mode: opt.mode,
		matchBrackets: true,
		//autoScrollCursorOnSet: false,
		theme: 'default'+((!!opt.readOnly && ' disabled') || ''),
		tabMode: 'indent',
		indentWithTabs: true,
		indentUnit: 4,
		lineWrapping: true,
		highlightSelectionMatches: {
			minChars:2,
			wordsOnly:true,
			//showToken:true,
			style:'searching'
		},
		readOnly: !!opt.readOnly, //'nocursor'
		continueComments: 'Enter',
		extraKeys: {
			'Ctrl-Q': 'toggleComment',
			'Ctrl-H': 'replace',
			'Alt-U': toggleCaseCM,
			'Alt-A': insertAnonymousFunction
		},
		viewportMargin: 200,
	};
	
	//now setup the codemirror on the textarea
	var cmElement = CodeMirror.fromTextArea(element[0],config);
	
	//ADD OVERLAYS
	//add the highlighter overlays if they are not blocked
	//-eventually use a loop here maybe, but it's easier to filter/disable specific overlays if they are individually added
	//-it's also easier to forget to add them here
	if(!opt.noOverlay){
		cmElement.addOverlay(overlays.imgtag[0],overlays.imgtag[1]);
		cmElement.addOverlay(overlays.oldhtml[0],overlays.oldhtml[1]);
		cmElement.addOverlay(overlays.hex6to3[0],overlays.hex6to3[1]);
		cmElement.addOverlay(overlays.etx[0],overlays.etx[1]);		
		cmElement.addOverlay(overlays.hrefspace[0],overlays.hrefspace[1]);
		cmElement.addOverlay(overlays.unicodesinglequote[0],overlays.unicodesinglequote[1]);
		cmElement.addOverlay(overlays.targetblankint[0],overlays.targetblankint[1]);
	}//if
	
	//store the cm ref on the textarea data attr
	element.data('element-cm',cmElement);

	//set the size of the codemirror if one was sent and the values are valid numbers or percents
	if(typeof(opt.size) == 'object' && !isNaN(parseInt(opt.size.w)) && !isNaN(parseInt(opt.size.h))){
		cmElement.setSize(parseInt(opt.size.w)+((!!(/\d+\%/g).test(opt.size.w) && '%') || ''),
			parseInt(opt.size.h))+((!!(/\d+\%/g).test(opt.size.h) && '%') || '');
	}//if
	
	//attach onchange function if sent
	if(typeof(opt.onChange) == 'function'){
		cmElement.on('change',opt.onChange);
	}//if
	
	//wait 1.5 sec and set the mode because it looks like it sometimes does not get set
	//TODO: figure out why this happens and fix it without a timeout
	setTimeout(function(){
		cmElement.setOption('mode',opt.mode);
	},1500);
	
	//return the new codemirror
	return cmElement;
};//func

//fire any stored _extCodeMirrorInit function after loading
if(typeof(window._extCodeMirrorInit) == 'function'){
	window._extCodeMirrorInit(extCodeMirror);
}//if

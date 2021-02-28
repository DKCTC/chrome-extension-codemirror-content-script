	
//create codemirror inside of an iframe
//-this script can fire inside of an iframe, so window references to codemirror need to be window.top

//-requires jQuery

//-requires Codemirror, tested with version 5.33.0
//https://github.com/codemirror/CodeMirror

//-requires chrome-extension-port-communications
//https://github.com/DKCTC/chrome-extension-port-communications


//opens connection to background.js
var iframeConnection = new Port({name: "iframeCodemirror"}),
	//find the correct window	
	realWindow = (window != window.top && window.top) || window,
	//storage for the codemirror obj
	cmElement;

//-this gets fired by ext-codemirror once it's done loading
realWindow._extCodeMirrorInit = function(extCodeMirror){
	
	//find your textarea
	var textarea = document.getElementById('txtHtml'),
		
		//optional: adjust the width of the container with the codemirror in it to eliminate scrolling
		//-this function finds the correct parent element
		findParent = function(el,selector){ if(el.matches(selector)){ return el; } else { return findParent(el.parentNode,selector); } },
		
		//optional: find the node to use for the width
		widthNode = findParent(textarea,'[style*="width: 100%"]');
	
	//optional: update the width to your chosen value
	widthNode.style.width = '98%';
	
	//turn the textarea into a codemirror
	cmElement = new extCodeMirror({
		element:textarea,
		onChange: function(cm,changeObj){
			//update the textarea with the new value
			textarea.value = cm.getValue();
		}
	});
	
	//optional: get the container element and style it so we don't have to have another stylesheet
	//-or add another stylesheet, your choice
	cmElement.display.wrapper.style.border = '1px solid #a9a9a9';
	cmElement.display.wrapper.style.height = '550px';
	
};

//load the codemirror scripts
//-first load the main library, then after that load all of the modes/addons and the mzp-codemirror script	
//-then create the codemirror
iframeConnection.postMessage({
	method: 'addScripts',
	//-update the paths to match your actual paths
	scripts: [ 'js/inc/lib/codemirror.js' ]
}, function(resp){
	//then load all of the codemirror plugins
	iframeConnection.postMessage({
		method: 'addScripts',
		//-update the paths to match your actual paths
		scripts: [
			'js/inc/mode/javascript/javascript.js',
			'js/inc/mode/css/css.js',
			'js/inc/mode/xml/xml.js',
			'js/inc/mode/htmlmixed/htmlmixed.js',
			'js/inc/addon/overlay/overlay.js',
			'js/inc/addon/search/search.js',
			'js/inc/addon/search/searchcursor.js',
			'js/inc/addon/search/match-highlighter.js',
			'js/inc/addon/dialog/dialog.js',
			'js/inc/ext/ext-codemirror.js'
		]
	}, function(resp2){});
});


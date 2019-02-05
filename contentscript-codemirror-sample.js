
//sample content script functions for loading the codemirror scripts so that they actually work

//-requires Codemirror, tested with version 5.33.0
//https://github.com/codemirror/CodeMirror

//-requires chrome-extension-port-communications
//https://github.com/dkline03/chrome-extension-port-communications

//-requires functions in background-sample-codemirror.js to load the scripts

//open connection to background script
var cmConnection = new Port({name: 'ext-codemirror'}),
	//the codemirror element
	codemirrorElement,
	//find existing textarea
	contentArea = document.getElementById('sample-cm-textarea');

//function to load the codemirror scripts in the correct order so that everything works
function loadCodemirror(contentArea, dimensionsObj){
	//if codemirror was already loaded, don't load it again, or if no contentArea was sent, do nothing
	//-codemirror itself will fail if contentArea is not a textarea
	if(typeof(CodeMirror) != 'undefined' || typeof(contentArea) == 'undefined'){ return false; }

	//use default dimensions if none are sent
	//TODO: use the dimensions of the textarea instead
	if(typeof(dimensionsObj) != 'object'){
		dimensionsObj = {w: 1024, h: 538};
	}
	
	//this function gets called after the ext-codemirror file is loaded
	//-so define it here before loading the file to avoid a race condition
	window._extCodeMirrorInit = function(){
		//create the new codemirror element
		codemirrorElement = new extCodeMirror({
			element:contentArea,
			size: dimensionsObj,
			onChange:function(cm,changeObj){
				//get the value and trim
				var _val = (cm.getValue() || '').trim();
				//set the value from codemirror to the textarea
				//-could also have similar onchange function on the textarea that updates the codemirror
				contentArea.val(_val);
			}});
	};//func _extCodeMirrorInit

	//load the codemirror css
	//-update the paths to match your actual paths
	document.head.innerHTML +=
		'\n\t<link rel="stylesheet" type="text/css" href="'
			+[		chrome.runtime.getURL('js/inc/lib/codemirror'),
					chrome.runtime.getURL('js/inc/addon/dialog/dialog'),
					chrome.runtime.getURL('css/inc/ext/ext-codemirror')
				].join('.css">\n\t<link rel="stylesheet" type="text/css" href="')
		+'.css">';

	//call background function for adding scripts
	//-works similarly to require.js
	//-start with the main codemirror.js plugin file
	//--update the paths to match your actual paths
	cmConnection.postMessage({
		method: 'addScripts',
		scripts: [
			'js/inc/lib/codemirror.js'
		]
	}, function(resp){
		//then load all of the codemirror plugins that you might want
		//-update the paths to match your actual paths
		cmConnection.postMessage({
			method: 'addScripts',
			scripts: [
				'js/inc/mode/javascript/javascript.js',
				'js/inc/mode/css/css.js',
				'js/inc/mode/xml/xml.js',
				'js/inc/mode/htmlmixed/htmlmixed.js',
				'js/inc/addon/overlay/overlay.js',
				'js/inc/addon/search/search.js',
				'js/inc/addon/search/searchcursor.js',
				'js/inc/addon/search/match-highlighter.js',
				'js/inc/addon/dialog/dialog.js'
			]
		}, function(resp2){
			//then load the final script
			//-update the paths to match your actual paths
			cmConnection.postMessage({
				method: 'addScripts',
				scripts: [
					'js/inc/ext/ext-codemirror.js'
				]
			});
		});//plugin add
	});//req/cm add
};//func

//create codemirror from textarea element
loadCodemirror(contentArea);


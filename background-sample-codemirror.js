
//background.js functions for adding scripts

//-requires chrome-extension-port-communications
//https://github.com/DKCTC/chrome-extension-port-communications

//the incoming port connection
var backgroundConnection = new Port();

//set all of the background communication listeners using chrome-extension-port-communications
backgroundConnection.addBroadcastListener({
	//adds multiple scripts in order to pages that run content scripts
	'addScripts': function(msg, sender, sendResponse){
		//create response
		var _response = { method: msg.method, response: [] };
		//go through the script file array and execute them
		$.each(msg.scripts, function(i,v){
			chrome.tabs.executeScript(sender.tab.id, {file: v}, function(response){
				_response.response.push(response);
			});
		});

		sendResponse(_response);
	},
	//adds a single script to pages that run content scripts
	'addScript': function(msg, sender, sendResponse){
		chrome.tabs.executeScript(sender.tab.id, {file: msg.filename}, function(_response){
			sendResponse($.extend({},_response));
		});
	},
	//same as addScript, but uses a string instead of a filename or external resource
	//-useful for combining with ajax calls to get strings of external js to work around the chrome extension restrictions for using external js resources
	//-might also be dangerous, so be careful and act responsibly
	'addScriptCode': function(msg, sender, sendResponse){
		chrome.tabs.executeScript(sender.tab.id, {code: msg.code}, function(_response){
			sendResponse($.extend({},_response));
		});
	}
});

let path = [];
localStorage.status = "stopped";


// Enable Pusher logging - don't include this in production
Pusher.log = function(message) {
  if (window.console && window.console.log) {
    window.console.log(message);
  }
};

let pusher = new Pusher("77fec1184d841b55919e", {
  cluster: "us2",
  encrypted: true,
  disableStats: true,
  logToConsole: false
});

// src/main.js
chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function(){
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [ new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {}
      })],
      actions: [ new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

var subscribe = function(profile){
  var channel = pusher.subscribe(profile.name);

  channel.bind("pusher:subscription_succeeded", function() {
    //console.log("Successfully subscribed to channel :"+profile.name);
  });

  channel.bind("test-created", function(test_msg) {
    var test = JSON.parse(test_msg);
    test.key = null;
    localStorage.setItem("test", JSON.stringify(test));
    // Trigger desktop notification
    var options = {
      type: "basic",
      title: "Test Created",
      message: test.name + " was created successfully",
      iconUrl: "images/qanairy_q_logo_black_48.png",
      isClickable: true
    }

    chrome.notifications.create("test-created-" + test.name, options, function(id) {});
  });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.msg === "start_recording"){
      localStorage.status = "recording";
      chrome.webNavigation.onCompleted.addListener(
        function(details){
          var path = JSON.parse(localStorage.getItem("path"));
          if(!path){
            path = [];
          }
          path.push({type: "page", url: details.url});
          localStorage.setItem("path", path);
        }
      );
      sendResponse({status: "starting"});
    }
    else if (request.msg === "start_test_run") {
      var path = request.data;
      //get first element from path. First element is expected to be a page, if it isn't then throw an error

      window.setTimeout( function(){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
          chrome.tabs.sendMessage(tabs[0].id, {msg: "run_test", data: path}, function(response) {
          });
        });
      }, 1500);

    }
    else if(request.msg === "addToPath" && localStorage.status !== "stopped"){
      var path = JSON.parse(localStorage.getItem("path"));
      if(path == null){
        path = [];
      }
      if(path.length === 0 || path[path.length-1].type !== "page"){
        path.push({type: "page", url: sender.tab.url});
        chrome.runtime.sendMessage({
            msg: "appendPathElement",
            data: {
                type: "page",
                url: sender.tab.url
            }
        });
      }

      path.push(request.data.element);
      chrome.runtime.sendMessage({
          msg: "appendPathElement",
          data: request.data.element

      });
      path.push(request.data.action);
      chrome.runtime.sendMessage({
          msg: "appendPathElement",
          data: request.data.action
      });
    }

    else if (request.msg === "authenticate") {
      // scope
      //  - openid if you want an id_token returned
      //  - offline_access if you want a refresh_token returned
      // device
      //  - required if requesting the offline_access scope.
      let options = {
        responseType: "token id_token",
        scope: "openid profile",
        audience: "https://staging-api.qanairy.com",
        device: "chrome-extension"
      };

      new Auth0Chrome("staging-qanairy.auth0.com", "mMomHg1ZhzZkM4Tsz2NGkdJH3eeJqIq6")
        .authenticate(options)
        .then(function (authResult) {

          localStorage.authResult = JSON.stringify(authResult);
          chrome.notifications.create({
            type: "basic",
            iconUrl: "images/qanairy_q_logo_black_48.png",
            title: "Login Successful",
            message: "You can use the app now"
          });

          chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {action: "open_dialog_box", msg: "open_recorder"}, function(response) {});
          });
          subscribe( jwt_decode(authResult.id_token));

          //call show recorder here
        }).catch(function (err) {
          chrome.notifications.create({
            type: "basic",
            title: "Login Failed",
            message: err.message,
            iconUrl: "images/qanairy_q_logo_black_48.png"
          });
        });
    }
    else if(request.msg === "subscribe_to_platform"){
      localStorage.profile = request.data;
      subscribe(request.data);
    }
    else if(request.msg === 'redirect-tab'){
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
       chrome.tabs.update(tabs[0].id, {url: request.msg.data});
     });
    }
    else if(request.msg === 'edit-test'){
        localStorage.status = "editing";
        var test = request.data;
        localStorage.test = JSON.stringify(test);


				// Trigger desktop notification
				var options = {
					type: "basic",
					title: "Test Received",
					message: "A test has been received for editing",
					iconUrl: "images/qanairy_q_logo_black_48.png",
					isClickable: true
				}

				chrome.notifications.create("edit-test-" + localStorage.test.name, options, function(id) {});

        localStorage.path = JSON.stringify(test.path);
        chrome.runtime.sendMessage({
            msg: "loadTest",
            data: localStorage.test
        });
    }
    return Promise.resolve("Dummy response to keep the console quiet");

  });

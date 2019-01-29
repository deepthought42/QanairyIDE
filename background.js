let path = [];
let status = "stopped";


// Enable Pusher logging - don't include this in production
Pusher.log = function(message) {
  if (window.console && window.console.log) {
    window.console.log(message);
  }
};

var pusher = new Pusher("77fec1184d841b55919e", {
  cluster: "us2",
  encrypted: true,
  disableStats: true
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

  channel.bind("edit-test", function(test) {
    chrome.storage.local.get({
      notifications: true
    }, function(event_data) {
        //send path to recorder
        chrome.runtime.sendMessage({
            msg: "loadTest",
            data: JSON.parse(test)
        });

        // Trigger desktop notification
        var options = {
          type: "basic",
          title: "Test Received",
          message: "A test has been received for editing",
          iconUrl: "images/qanairy_logo.png",
          isClickable: true
        }

        chrome.notifications.create("edit-test-" + JSON.parse(test).key, options, function(id) {});
    });
  });

  channel.bind("test-created", function(test) {
    chrome.storage.local.get({
      notifications: true
    }, function(event_data) {
        // Trigger desktop notification
        var options = {
          type: "basic",
          title: "Test Created",
          message: test.name + " was created successfully in Qanairy",
          iconUrl: "images/qanairy_q_logo_white.png",
          isClickable: true
        }

        chrome.notifications.create("test-created" + JSON.parse(test).key, options, function(id) {});
    });

  });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.msg === "start_recording"){
      status = "recording";
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
      if(path[0].url){
        var url = path[0].url;
        //redirect to url
        chrome.tabs.query({currentWindow: true, active: true}, function(tab){
          chrome.tabs.update(tab.id, {url: url});
        });
      }
      else{
        alert("Paths are expected to start with a page");
      }

      window.setTimeout( function(){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
          chrome.tabs.sendMessage(tabs[0].id, {msg: "run_test", data: path}, function(response) {
          });
        });
      }, 1500);

    }
    else if(request.msg === "addToPath" && status !== "stopped"){
      var path = localStorage.path;
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
        scope: "openid profile offline_access",
        device: "chrome-extension"
      };

      new Auth0Chrome("staging-qanairy.auth0.com", "mMomHg1ZhzZkM4Tsz2NGkdJH3eeJqIq6")
        .authenticate(options)
        .then(function (authResult) {
          localStorage.authResult = JSON.stringify(authResult);
          chrome.notifications.create({
            type: "basic",
            iconUrl: "images/qanairy_logo.png",
            title: "Login Successful",
            message: "You can use the app now"
          });

          fetch("https://staging-qanairy.auth0.com/userinfo", {
            headers: {
              "Authorization": `Bearer ${authResult.access_token}`
            }
          }).then((resp) => resp.json()).then((profile) => {
              localStorage.setItem("profile", profile);
              subscribe(profile);
            });

          chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {action: "open_dialog_box", msg: "open_recorder"}, function(response) {});
          });
          //call show recorder here
        }).catch(function (err) {
          chrome.notifications.create({
            type: "basic",
            title: "Login Failed",
            message: err.message,
            iconUrl: "images/qanairy_logo.png"
          });
        });
    }
    else if(request.msg === "subscribe_to_platform"){
      //send message to open recorder panel
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action: "open_dialog_box", msg: "open_recorder"}, function(response) {
        });
      });

      var authResult = JSON.parse(localStorage.getItem("authResult"));
      fetch(`https://staging-qanairy.auth0.com/userinfo`, {
        headers: {
          "Authorization": "Bearer "+authResult.access_token
        }
      }).then(resp => resp.json()).then((profile) => {
          localStorage.profile = profile;
          subscribe(profile);
        });
    }
  });

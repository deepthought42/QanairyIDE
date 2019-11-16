let path = [];
localStorage.status = "stopped";

// Enable Pusher logging - don't include this in production
/*Pusher.log = function(message) {
  if (window.console && window.console.log) {
    window.console.log(message);
  }
};
*/
let pusher = new Pusher("77fec1184d841b55919e", {
  cluster: "us2",
  encrypted: true,
  disableStats: true,
  logToConsole: false
});

chrome.runtime.onInstalled.addListener(function() {
});

/*
 *
 */
var subscribe = function(channel_name){
  var channel = pusher.subscribe(channel_name);

  channel.bind("pusher:subscription_succeeded", function() {
    //console.log("Successfully subscribed to channel :"+profile.name);
  });

  channel.bind("test-created", function(test_msg) {
    var test = JSON.parse(test_msg);
    test.key = "";
    localStorage.setItem("test", JSON.stringify(test));
    // Trigger desktop notification
    let options = {
      type: "basic",
      title: "Test Created",
      message: test.name + " was created successfully",
      iconUrl: "images/qanairy_q_logo_black_48.png",
      isClickable: true
    }

    chrome.notifications.create("test-created-" + test.name, options, function(id) {});
    chrome.runtime.sendMessage({msg: "show-test-saved-successfully-msg", data: test.name}, function(){});
  });
};

chrome.runtime.onMessage.addListener(function (event) {
  if (event.type === "start_recording"){
    localStorage.status = "recording";
    chrome.webNavigation.onCompleted.addListener(
      function(details){
        let temp_path = JSON.parse(localStorage.getItem("path"));
        if(!temp_path){
          path = [];
        }
        temp_path.push({type: "page", url: details.url});
        localStorage.setItem("path", temp_path);
      }
    );
    sendResponse({status: "starting"});
  }
  else if (event.type === "start_test_run") {
    //get first element from path. First element is expected to be a page, if it isn't then throw an error

    window.setTimeout( function(){
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {msg: "run_test", data: event.data}, function(response) {
        });
      });
    }, 500);

  }
  else if(event.type === "addToPath" && localStorage.status !== "stopped"){
    let temp_path = JSON.parse(localStorage.getItem("path")) || [];

    if(temp_path.length === 0 || temp_path[temp_path.length-1].type !== "page"){
      temp_path.push({type: "page", url: sender.tab.url});
      chrome.runtime.sendMessage({
          msg: "appendPathElement",
          data: {
              type: "page",
              url: sender.tab.url
          }
      });
    }

    temp_path.push(event.data.element);
    chrome.runtime.sendMessage({
        msg: "appendPathElement",
        data: event.data.element

    });
    temp_path.push(event.data.action);
    chrome.runtime.sendMessage({
        msg: "appendPathElement",
        data: event.data.action
    });
  }
  else if (event.type === "authenticate") {
    let options = {
      responseType: "token id_token",
      scope: "openid profile offline_access",
      audience: "https://staging-api.qanairy.com",
      device: "chrome-extension"
    };
    new Auth0Chrome(env.AUTH0_DOMAIN, env.AUTH0_CLIENT_ID)
      .authenticate(options)
      .then(function (authResult) {
        localStorage.authResult = JSON.stringify(authResult);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "images/qanairy_q_logo_white.png",
          title: "Login Successful",
          message: "You can record tests now"
        });
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
          chrome.tabs.sendMessage(tabs[0].id, {action: "open_dialog_box", msg: "open_recorder"}, function(response) {});
        });

      }).catch(function (err) {
        chrome.notifications.create({
          type: "basic",
          title: "Login Failed",
          message: err.message,
          iconUrl: "images/qanairy_q_logo_white.png"
        });
      });
  }
  else if(event.msg === "subscribe_to_platform"){
    subscribe(jwt_decode(event.data).name);
  }
  else if(event.msg === "redirect-tab"){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
     chrome.tabs.update(tabs[0].id, {url: event.msg.data});
   });
  }
  else if(event.msg === "edit-test"){
      localStorage.status = "editing";
      var test = event.data;
      localStorage.test = JSON.stringify(test);

      // Trigger desktop notification
      let options = {
        type: "basic",
        title: "Test Opened",
        message: "This test can now be edited",
        iconUrl: "images/qanairy_q_logo_black_48.png",
        isClickable: true
      };

      chrome.notifications.create("edit-test-" + localStorage.test.name, options, function(id) {});

      localStorage.path = JSON.stringify(test.path);
      chrome.runtime.sendMessage({
          msg: "loadTest",
          data: localStorage.test
      });
  }
  else if(event.msg === "show-test-saved-msg"){
    // Trigger desktop notification that test was saved successfully
    let options = {
      type: "basic",
      title: "Your test is being processed",
      message: "Qanairy is building your test. We'll let you know when it's ready.",
      iconUrl: "images/qanairy_q_logo_black_48.png",
      isClickable: true
    };

    chrome.notifications.create("test-saved-successfully", options, function(id) {
    });
  }
});

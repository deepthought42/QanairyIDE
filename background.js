let path = [];
let status = "stopped";
chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function(){
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [ new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {}
      })],
      actions: [ new chrome.declarativeContent.ShowPageAction()]
    }])
  })
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.msg === "start_recording"){
      status = "recording";
      chrome.webNavigation.onCompleted.addListener(
        function(details){
          var path = JSON.parse(localStorage.getItem("path"));
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
        var url = path[0].url
        //redirect to url
        chrome.tabs.query({currentWindow: true, active: true}, function(tab){
          chrome.tabs.update(tab.id, {url: url});
        });
      }
      else{
        alert("Path's are expected to start with a page");
      }

      window.setTimeout( function(){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
          chrome.tabs.sendMessage(tabs[0].id, {msg: "run_test", data: path}, function(response) {
          });
        });
      }, 1500);

    }
    else if(request.msg === "addToPath" && status !== "stopped"){
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
  });

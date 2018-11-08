let path = [];
let status = "stopped";
chrome.runtime.onInstalled.addListener(function() {

});

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.windows.create({
    url: chrome.runtime.getURL("recorder.html"),
    width: 300,
    height: 550,
    type: "popup"
  }, function(win) {
    // win represents the Window object from windows API
    // Do something after opening
  });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");


    console.log("event passed :: "+request);
    console.log("event passed :: "+request.msg);

    if (request.msg == "start_recording"){
      status = "recording";
      chrome.webNavigation.onCompleted.addListener(
        function(details){
          path.push({type: "page", url: details.url});
          console.log("Browser redirected to URL :: "+details.url)
        }
      );
      sendResponse({status: "starting"});
    }
    else if (request.msg == "stop_recording") {
      status = "stopped";
      console.log("status");
      sendResponse({status: "stopping"});
    }
    else if(request.msg == "addToPath" && status != "stopped"){
      console.log("adding to path  :::   "+request.data);
      console.log("adding to path ::: "+request.data.target);
      console.log(" PATH  ::   "+path);
      console.log("PATH SIZE  ::   "+path.length)
      if(path.length == 0 || path[path.length-1].type != "page"){
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

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
          var path = JSON.parse(localStorage.getItem("path"));
          path.push({type: "page", url: details.url});
          localStorage.setItem("path", path);
          console.log("Browser redirected to URL :: "+details.url)
        }
      );
      sendResponse({status: "starting"});
    }
    else if (request.msg == "nav_to_page") {

      console.log("Page element experienced. Loading page with url : "+request.data.url);
      var url = request.data.url
      //redirect to url
      chrome.tabs.query({currentWindow: true, active: true}, function(tab){
        chrome.tabs.update(tab.id, {url: url});
      });

      sendResponse({status: "ran test"});
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

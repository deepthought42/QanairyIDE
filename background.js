chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log("Qanairy installed successfully");
  });

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {},
        })
        ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
    });
});


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");

    if (request.recorder == "start"){
      chrome.webNavigation.onCompleted.addListener(
        function(details){
          console.log("Browser redirected to URL :: "+details.url)
        }
      );
      sendResponse({status: "starting"});
    }
    else if (request.recorder == "stop") {
      console.log("status");
      chrome.webNavigation.onCompleted.removeListener(function(object){
        console.log("removing listener");
      });
      sendResponse({status: "stopping"});
    }
  });

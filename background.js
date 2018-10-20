let path = [];

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


    console.log("event passed :: "+request);
    console.log("event passed :: "+request.msg);
    if (request.msg == "start"){
      path = [];
      console.log("Start event fired");
      chrome.webNavigation.onCompleted.addListener(
        function(details){
          path.push({type: "page", url: details.url});
          console.log("Browser redirected to URL :: "+details.url)
        }
      );
      sendResponse({status: "starting"});
    }
    else if (request.msg == "stop") {
      console.log("status");
      chrome.webNavigation.onCompleted.removeListener(function(object){
        console.log("removing listener");
      });
      path = [];
      sendResponse({status: "stopping"});
    }
    else if(request.msg == "addToPath"){
      console.log("adding to path  :::   "+request.data);
      console.log(" PATH  ::   "+path);
      console.log("PATH SIZE  ::   "+path.length)
      if(path.length == 0 || path[path.length-1].type != "page"){
        path.push({type: "page", url: sender.tab.url});
        chrome.runtime.sendMessage({
            msg: "appendPathElement",
            data: {
                {type: "page", url: sender.tab.url}
            }
        });
      }

      path.push(request.data.element);
      chrome.runtime.sendMessage({
          msg: "appendPathElement",
          data: {
            request.data.element
          }
      });
      path.push(request.data.action);
      chrome.runtime.sendMessage({
          msg: "appendPathElement",
          data: {
              (request.data.action
          }
      });

      //****************************************
      //test path export code
      //****************************************
      var xhr = new XMLHttpRequest();
      //xhr.open("POST", "https://api.qanairy.com/testIDE", true);
      xhr.open("POST", "http://localhost:9080/testIDE", true);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.onload = function() {
        console.log("xhr  : : "+xhr);
        console.log("onloaded stuff  "+JSON.parse(xhr));

        console.log("onloaded stuff  "+JSON.parse(xhr.responseText));
        if (xhr.readyState == 4) {
          // JSON.parse does not evaluate the attacker's scripts.
          var resp = JSON.parse(xhr.responseText);
          document.getElementById("resp").innerText = xhr.responseText;
        }
      }
      xhr.send(JSON.stringify({name: "test testing", path: path}));
//      console.log("path   :::   "+JSON.stringify(path));
      sendResponse({status: path});

    }
  });

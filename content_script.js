//fire event to listen for url change events and action events

console.log("content script");

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("request :: "+request);
    console.log("sender :: "+sender);
    console.log("sendResponse  ::  "+sendResponse);
    document.addEventListener("click", function(event){
      console.log(" action listenter event   ::   "+event);
      console.log(" event client  x   ::   "+event.clientX);
      console.log(" event client y   ::   "+event.clientY);
      console.log(" event related target   ::   "+event.relatedTarget);
      console.log(" event region   ::   "+event.region);
      console.log(" which   ::   "+event.which);


      console.log(" action listenter event keys   ::   "+Object.keys(event));
      console.log(" action listenter event   ::   "+event.isTrusted);

      chrome.runtime.sendMessage({msg: "addToPath", data: { element: {type: "pageElement", client_x: event.clientX, client_y: event.clientY}, action: {type: "action", name: "click", value: ""}}}, function(response) {
        console.log("response ::  " +JSON.stringify(response));
      });
    });
  }
)

//fire event to listen for url change events and action events

console.log("content script");

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("request :: "+request);
    console.log("sender :: "+sender);
    console.log("sendResponse  ::  "+sendResponse);
    document.addEventListener("click", function(event){

      console.log(" action listenter event   ::   "+event);
      console.log(" action listenter event keys   ::   "+Object.keys(event));
      console.log(" action listenter event   ::   "+event.isTrusted);
    });
  }
)

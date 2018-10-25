//fire event to listen for url change events and action events

console.log("loading content script");

var node = document.createElement("iframe");
node.id="qanairy_ide_frame";
node.style.cssText = 'position:absolute;width:250px;height:400px;z-index:100';
node.src = "http://localhost:3000";

var header = document.createElement("div");
header.style.cssText = 'width:100%;height:20px';
header.id="qanairy_ide_header";

var body = document.createElement("div");
body.style.cssText = 'width:100%;height:20px';
body.id="qanairy_ide_body";
body.appendChild(node);

var parent = document.createElement("div");
parent.style.cssText = 'position:absolute;width:250px;height:400px;z-index:100';
parent.id="qanairy_ide";
parent.appendChild(header);
parent.appendChild(body);
document.body.appendChild(parent);

console.log("appended div to body")
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("request :: "+request);
    console.log("sender :: "+sender);
    console.log("sendResponse  ::  "+sendResponse);
    document.addEventListener("click", function(event){
      console.log(" action listener event   ::   "+event);
      console.log(" event client  x   ::   "+event.clientX);
      console.log(" event client y   ::   "+event.clientY);
      console.log(" event related target   ::   "+event.relatedTarget);

      console.log(" event related target   ::   "+Object.keys(event.relatedTarget));
      console.log(" event region   ::   "+event.region);
      console.log(" which   ::   "+event.which);


      console.log(" action listenter event keys   ::   "+Object.keys(event));
      console.log(" action listenter event   ::   "+event.isTrusted);

      chrome.runtime.sendMessage({msg: "addToPath", data: { element: {type: "pageElement", target: event.relatedTarget, client_x: event.clientX, client_y: event.clientY}, action: {type: "action", name: "click", value: ""}}}, function(response) {
        console.log("response ::  " +JSON.stringify(response));
      });
    });
  }
)

// Make the DIV element draggable:
dragElement(document.getElementById("qanairy_ide"));

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "_header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "_header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

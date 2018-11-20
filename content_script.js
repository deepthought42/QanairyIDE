//fire event to listen for url change events and action events

console.log("loading content script");

var iframe = document.createElement("iframe");
iframe.id="qanairy_ide_frame";
iframe.style.cssText = 'position:absolute;width:300px;height:450px;z-index:100';
iframe.src = chrome.extension.getURL('/recorder.html');

var header_inner_html = "<button id='close_qanairy_ide' style='position:relative;left:230px;height:100%'> x </button>"
var header = document.createElement("div");
header.style.cssText = 'width:300px;height:20px;z-index:100;background-color:#553fc0';
header.id="qanairy_ide_header";
header.innerHTML = header_inner_html;

var body = document.createElement("div");
body.style.cssText = 'width:100%;height:20px';
body.id="qanairy_ide_body";
body.appendChild(iframe);

var parent = document.createElement("div");
parent.style.cssText = 'position:absolute;width:300px;height:450px;z-index:100';
parent.id="qanairy_ide";
parent.appendChild(header);
parent.appendChild(body);
document.body.appendChild(parent);

let uppercase = false;

let close_ide_button = document.getElementById("close_qanairy_ide");
close_ide_button.onclick = function(){
  console.log("clicked on close button");
  //hide parent element
  parent.style.display = "none";
}

let recorder_click_listener = function(event){
  var xpath = "";
  //get all elements on page
  document.querySelectorAll('body *').forEach(function(node){
    var rect = node.getBoundingClientRect();
    if(event.clientX >= rect.left && event.clientY >= rect.top && event.clientX <= rect.right && event.clientY <= rect.bottom ){
      //console.log(rect.top, rect.right, rect.bottom, rect.left);
      xpath = generateXpath(node);
      console.log("GENERATED xpath :: "+xpath);
    }
  })
  //build list of elements where the x,y coords and height,width encompass the event x,y coords


  //iframe.contentWindow.postMessage({element: {type: "element", xpath: xpath}, action: {type: "action", name: "click", value:""}}, "http://localhost:3000");

  chrome.runtime.sendMessage({msg: "addToPath",
                              data: {url: window.location.toString(),
                                     pathElement: {
                                       element: {
                                         type: "pageElement",
                                         target: event.relatedTarget,
                                         xpath: xpath
                                       },
                                       action: {
                                         type: "action",
                                         name: "click",
                                         value: ""
                                       }
                                     }
                                   }
                                 },
     function(response) {
       console.log("response ::  " +JSON.stringify(response));
     }
   );
}

let recorder_keyup_listener = function(event){

  //check if shift key
  if(event.keyCode === 16){
    uppercase = !uppercase;
    return;
  }
  //check for caps lock key
  else if(event.keyCode === 20){
    return;
  }

  var key = String.fromCharCode(event.keyCode);
  if(!uppercase){
    key = key.toLowerCase();
  }
  else{
    key = key.toUpperCase();
  }

  console.log("KEY released :: "+key);

  var xpath = "";
  //get all elements on page
  document.querySelectorAll('body *').forEach(function(node){
    var rect = node.getBoundingClientRect();
    if(event.clientX >= rect.left && event.clientY >= rect.top && event.clientX <= rect.right && event.clientY <= rect.bottom ){
      //console.log(rect.top, rect.right, rect.bottom, rect.left);
      xpath = generateXpath(node);
    }
  });

  chrome.runtime.sendMessage({msg: "addToPath",
                              data: {url: window.location.toString(),
                                     pathElement: {
                                       element: {
                                         type: "pageElement",
                                         target: event.relatedTarget,
                                         xpath: xpath
                                       },
                                       action: {
                                         type: "action",
                                         name: "sendKeys",
                                         value: key
                                       }
                                     }
                                   }
                                 },
     function(response) {
       console.log("response ::  " +JSON.stringify(response));
     }
   );
}

let recorder_keydown_listener = function(event){
  //check if shift key
  if(event.keyCode === 16){
    uppercase = !uppercase;
  }
  //check for caps lock key
  else if(event.keyCode === 20){
    uppercase = !uppercase;
  }
}


String.prototype.indexOfRegex = function(regex){
  var match = this.match(regex);
  return match ? this.indexOf(match[0]) : -1;
}


/*
 * Runs a test from beginning to end
 */
let runTest = function(path){
  console.log("expecting page to be loaded now that I've waited for 5 seconds");
  //process elements
  for(var idx=1; idx< path.length; idx++){
      if(path[idx].url){
        //if element is a page then send message to background to navigate page
        console.log("Another page was experienced");
      }
      else if(path[idx].element){
        console.log("Page element experienced. Performing + " + path[idx].action.name + "   on element with xpath : "+path[idx].element.xpath);
        //document.evaluate(path[idx].element.xpath, Document, );

        console.log("xpath :: "+path[idx].element.xpath);
        var xpathResult = document.evaluate(path[idx].element.xpath, document, null, XPathResult.ANY_TYPE, null).iterateNext();
        //verify that element exists on page
        if(xpathResult){
          console.log("xpath result exists  :   "+xpathResult);
          //perform action on element
          xpathResult.click();
          console.log("performed click");
          xpathResult.value = "testing yo!";
          console.log("set value on input   :  "+xpathResult.value);
        }
        else{

        }
      }
      else {
        console.log("Unknown path element experienced at index "+idx);
      }
  }
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("request :: "+request);
    console.log("sender :: "+sender);
    console.log("sendResponse  ::  "+sendResponse);
    if (request.msg == "start_recording"){
      path = [];
      status = "recording";

      document.addEventListener("click", recorder_click_listener);
      document.addEventListener('keyup', recorder_keyup_listener);
      document.addEventListener('keydown', recorder_keydown_listener);

      sendResponse({status: "starting"});
    }
    else if (request.msg == "stop_recording") {
      status = "stopped";

      document.removeEventListener("click", recorder_click_listener);
      document.removeEventListener("keyup", recorder_keydown_listener);
      document.removeEventListener("keydown", recorder_keydown_listener);

      sendResponse({status: "stopping"});
    }
    else if(request.msg = "run_test"){
     runTest(request.data);
   }
});


//generates x unique xpath for a given element
let generateXpath = function(elem){
  console.log("ELEM ;; "+elem);
  var xpath = "//"+elem.tagName.toLowerCase();
  var attributes = ["id", "name", "class"];
  var attributes_check = [];

  console.log("xpath :: "+xpath);

  for(var idx=0; idx< attributes.length; idx++){
    console.log("xpath with attributes :: "+xpath);

    if(elem.getAttribute(attributes[idx]) !== undefined && elem.getAttribute(attributes[idx]) !== null){
      console.log("attributes :: "+elem.getAttribute(attributes[idx]));

      attributes_check.push("contains(@"+attributes[idx] +",'"+elem.getAttribute(attributes[idx])+"')");
    }

    if(attributes_check.length > 0){
      xpath += "[";
      for(var idx=0; idx < attributes_check.length; idx++){
        xpath += attributes_check[idx];
        if(idx < attributes_check.length-1){
          xpath += " and ";
        }
      }
      xpath += "]";
    }
    console.log("xpath 1 :: "+xpath);

    var elements = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

    if(elements.length > 1){
      var count = 1;
      for(var idx=0; idx < elements.length; idx++){
        if(elements[idx].getTagName().equals(elem.getTagName())
            && elements[idx].getText().equals(elem.getText())){
              xpath += ("("+xpath+")[" + count + "]");
        }
        count++;
      }
    }
    console.log("xpath 2 :: "+xpath);

  //  console.log("xpath  :::   "+xpath);

    return xpath;
  }
}

/**
 *
 * Make plugin frame draggable by using the header to drag frame around
 *
 */


// Make the DIV element draggable:
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
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

  if (document.getElementById(elmnt.id +"_header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id +"_header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }
}


// Make the DIV element draggable:
dragElement(document.getElementById("qanairy_ide"));

  /**
	 * creates a unique xpath based on a given hash of xpaths
	 *
	 * @param driver
	 * @param xpathHash
	 *
	 * @return
	 */
   /*
let uniqifyXpath = function(WebElement elem, Map<String, Integer> xpathHash, String xpath, WebDriver driver){
		try {
			List<WebElement> elements = driver.findElements(By.xpath(xpath));

			if(elements.size()>1){
				int count = 1;
				for(WebElement element : elements){
					if(element.getTagName().equals(elem.getTagName())
							&& element.getText().equals(elem.getText())){
						return "("+xpath+")[" + count + "]";
					}
					count++;
				}
			}

		}catch(InvalidSelectorException e){
			log.error(e.getMessage());
		}

		return xpath;
	}
*/

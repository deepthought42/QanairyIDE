//fire event to listen for url change events and action events

console.log("loading content script");

var iframe = document.createElement("iframe");
iframe.id="qanairy_ide_frame";
iframe.style.cssText = 'position:absolute;width:250px;height:400px;z-index:100';
iframe.src = chrome.extension.getURL('/recorder.html');


var header = document.createElement("div");
header.style.cssText = 'width:100%;height:20px';
header.id="qanairy_ide_header";

var body = document.createElement("div");
body.style.cssText = 'width:100%;height:20px';
body.id="qanairy_ide_body";
body.appendChild(iframe);

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
  }
)


document.addEventListener("click", function(event){
  console.log(" action listener event   ::   "+event);

  var xpath = "";
  //get all elements on page
  document.querySelectorAll('body *').forEach(function(node){
    var rect = node.getBoundingClientRect();
    if(event.clientX >= rect.left && event.clientY >= rect.top && event.clientX <= rect.right && event.clientY <= rect.bottom ){
      //console.log(rect.top, rect.right, rect.bottom, rect.left);
      xpath = generateXpath(node);
    }
  })
  //build list of elements where the x,y coords and height,width encompass the event x,y coords


  //iframe.contentWindow.postMessage({element: {type: "element", xpath: xpath}, action: {type: "action", name: "click", value:""}}, "http://localhost:3000");

  chrome.runtime.sendMessage({msg: "addToPath", data: { element: {type: "pageElement", target: event.relatedTarget, client_x: event.clientX, client_y: event.clientY}, action: {type: "action", name: "click", value: ""}}}, function(response) {
    console.log("response ::  " +JSON.stringify(response));
  });
  
});

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

let generateXpath = function(elem){
  var xpath = "//"+elem.tagName.toLowerCase();
  var attributes = ["id", "name", "class"];
  var attributes_check = [];

  for(var idx=0; idx< attributes.length; idx++){
    if(elem.getAttribute(attributes[idx]) != undefined && elem.getAttribute(attributes[idx]) != null){
      attributes_check.push("contains(@"+attributes[idx] +",'"+elem.getAttribute(attributes[idx])+"')");
      if(attributes[idx]=="id"){
        break;
      }
    }
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

  var elements = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

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

  console.log("xpath  :::   "+xpath);

  return xpath;
}

/**
	 * generates a unique xpath for this element.
	 *
	 * @return an xpath that identifies this element uniquely
	 */
   /*
let generateXpath = function(WebElement element, String xpath, Map<String, Integer> xpathHash, WebDriver driver, Set<Attribute> attributes){
		ArrayList<String> attributeChecks = new ArrayList<String>();

		xpath += "//"+element.getTagName();
		for(Attribute attr : attributes){
			if(Arrays.asList(valid_xpath_attributes).contains(attr.getName())){

				String attribute_values = ArrayUtility.joinArray(attr.getVals().toArray(new String[attr.getVals().size()]));
				if(attribute_values.contains("\"")){
					attributeChecks.add("contains(@" + attr.getName() + ",\"" +generateConcatForXPath(attribute_values.trim())+ "\")");
				}
				else{
					attributeChecks.add("contains(@" + attr.getName() + ",\"" + escapeQuotes(attribute_values.trim()) + "\")");
				}
			}
		}
		if(attributeChecks.size()>0){
			xpath += "[";
			for(int i = 0; i < attributeChecks.size(); i++){
				xpath += attributeChecks.get(i).toString();
				if(i < attributeChecks.size()-1){
					xpath += " and ";
				}
			}
			xpath += "]";
		}

	    WebElement parent = element;
	    int count = 0;
	    while(!parent.getTagName().equals("html") && !parent.getTagName().equals("body") && parent != null && count < 4){
	    	try{
	    		parent = getParentElement(parent);
	    		if(driver.findElements(By.xpath("//"+parent.getTagName() + xpath)).size() == 1){
	    			return "//"+parent.getTagName() + xpath;
	    		}
	    		else{
		    		xpath = "/" + parent.getTagName() + xpath;
	    		}
	    	}catch(InvalidSelectorException e){
	    		parent = null;
	    		log.error("Invalid selector exception occurred while generating xpath through parent nodes");
	    		break;
	    	}
	    	count++;
	    }
	    xpath = "/"+xpath;
		return uniqifyXpath(element, xpathHash, xpath, driver);
	}
*/
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

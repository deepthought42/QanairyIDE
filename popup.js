let startRecording = document.getElementById('startRecording');
let stopRecording = document.getElementById('stopRecording');
let exportTest = document.getElementById('exportTest');
let pageElementForm = document.getElementById('pageElementForm');
let createPathElementButton = document.getElementById('createPathElementButton');
let createPageButton = document.getElementById('createPageButton');
let savePageElement = document.getElementById('savePageElement');

startRecording.style.display = "block";
stopRecording.style.display = "none";
pageElementForm.style.display = "none";
pageForm.style.display = "none";

savePageElement.onclick = function(element){
  let pageElement = { xpath: document.getElementById('pageElementXpath').value };
  let action = { name: document.getElementById('actionName').value,
                 value: document.getElementById('actionValue').value };
  chrome.runtime.sendMessage({msg: "appendPathElement", data: {element : pageElement, action: action}}, function(response) {
    console.log("append path element returned : ");
  });
}

createPathElementButton.onclick = function(element){
  console.log("showing page element form");
  pageForm.style.display = "none";
  pageElementForm.style.display = "block";
}

createPageButton.onclick = function(element){
  console.log("showing page form");
  pageElementForm.style.display = "none";
  pageForm.style.display = "block";
}

//start recording user interaction
startRecording.onclick = function(element) {
  chrome.runtime.sendMessage({msg: "start"}, function(response) {
    startRecording.style.display = "none";
    stopRecording.style.display = "block";
    console.log(response.status);
  });


  chrome.tabs.query(
      { currentWindow: true, active: true },
      function (tabArray) {
        chrome.tabs.sendMessage(tabArray[0].id, {status: "recording"}, function(response){
          console.log("sent message to tab id :: "+tabArray[0].id);
        })
      }
  );
};

//Stop recording user interactions
stopRecording.onclick = function(element){
  stopRecording.style.display = "none";
  startRecording.style.display = "block";
  console.log("stopping event listener");

  //fire event to stop listening for url change events and action events
  chrome.runtime.sendMessage({msg: "stop"}, function(response) {
    console.log(response.status);
  });

}

exportTest.onclick = function(element){
  console.log("exporting test");

  //fire event to stop listening for url change events and action events
  chrome.runtime.sendMessage({msg: "export"}, function(response) {
    console.log("PATH :: " +JSON.stringify(response.status));
  });
}

/*
let generateXpath = function(){
  ArrayList<String> attributeChecks = new ArrayList<String>();

		xpath += "//"+element.getTagName(element);
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

//makes sure that xpath for element is unique
let uniqifyXpath = function(){
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

		return xpath;
}
*/

//receive path element
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.msg === "appendPathElement") {
            //  To do something

            console.log("REQUEST DATA FOR ADDING TO PATH :: " + request.data);
            var path_element = "<div class='col-xs-12 path-element'>";
            if(request.data.type == 'page'){
              path_element = "url : "+ request.data.url+"</div>";
            }
            else if(request.data.type == 'pageElement'){
              path_element = "element coordinates : ("+ request.data.client_x+" : " +request.data.client_y+")";
            }
            else if(request.data.type == 'action'){
              path_element = "action : "+request.data.name;
            }
            path_element = "</div>";
            $('#test_path_viewer').append(path_element);
        }
    }
);

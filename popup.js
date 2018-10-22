let startRecording = document.getElementById('startRecording');
let stopRecording = document.getElementById('stopRecording');
let exportTest = document.getElementById('exportTest');
let pageElementForm = document.getElementById('pageElementForm');
let createPathElementButton = document.getElementById('createPathElementButton');
let savePageElement = document.getElementById('savePageElement');

startRecording.style.display = "block";
stopRecording.style.display = "none";
pageElementForm.style.display = "none";

savePageElement.onclick = function(element){
  let pageElement = {xpath: document.getElementById('pageElementXpath').value}
  chrome.runtime.sendMessage({msg: "appendPathElement", data: pageElement}, function(response) {

  }
}

createPathElementButton.onclick = function(element){
  console.log("shiwing page element form");
  pageElementForm.style.display = "block";
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

//receive path element
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.msg === "appendPathElement") {
            //  To do something

            console.log("REQUEST DATA FOR ADDING TO PATH :: " + request.data);
            var path_element = "";
            if(request.data.type == 'page'){
              path_element = "<div class='element-action node-group vertical__center__int'>url : "+ request.data.url+"</div>";
            }
            else if(request.data.type == 'pageElement'){
              path_element = "<div class='element-action node-group vertical__center__int'> element coordinates : ("+ request.data.client_x+" : " +request.data.client_y+")</div>";
            }
            else if(request.data.type == 'action'){
              path_element = "<div class='element-action node-group vertical__center__int'>action : "+request.data.name+"</div>";
            }
            $('#test_path_viewer').append(path_element);
        }
    }
);

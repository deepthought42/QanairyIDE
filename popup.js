let startRecording = document.getElementById('startRecording');
let stopRecording = document.getElementById('stopRecording');
let exportTest = document.getElementById('exportTest');
let showPageEditPanelButton = document.getElementById('createPageButton');
let showPageElementEditPanelButton = document.getElementById('createPathElementButton');
let pageEditPanel = document.getElementById('pageForm');
let pageElementEditPanel = document.getElementById('pageElementForm');
let pathElementRow = $('.path-element').on("click", function(){
  //send element to path element form
  var index = $(this).data("index");
  console.log("Clicked path element "+index);
});

pageEditPanel.style.display = "none";
pageElementEditPanel.style.display = "block";
startRecording.style.display = "block";
stopRecording.style.display = "none";

//start recording user interaction
startRecording.onclick = function(element) {
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

showPageEditPanelButton.onclick = function(page){
  console.log("show page edit panel");
  pageEditPanel.style.display = "block";
  pageElementEditPanel.style.display = "none";
}

showPageElementEditPanelButton.onclick = function(element){
  console.log("show page element edit panel");
  pageEditPanel.style.display = "none";
  pageElementEditPanel.style.display = "block";
}


let editPathElement = function(element_idx){
  console.log("editing path element  ::  " + element);
  PubSub.publish('edit-path-element', element);
}

//receive path element
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.msg === "addToPath") {
         var element=  `
         <div  class='row path-element' data-index="` + $('.path-element').length + `">
           <div class="col-xs-10">
             <div class="element col-xs-12">
               <div class='col-xs-3 path-element-type'>
                 xpath
               </div>
               <div class='col-xs-9 path-element-value'>
               </div>
             </div>
             <div class="action col-xs-12">
               <div class='col-xs-3 path-element-type'>
                 click
               </div>
               <div class='col-xs-9 path-element-value'>
                 none
               </div>
             </div>
           </div>
           <div class='col-xs-2 icons' >
             <i class='fa fa-pencil icon' onClick={this.editPathElement.bind(this, item)}></i>
             <i class='fa fa-times icon delete-icon' onClick={this.removePathElement.bind(this, item)}></i>
           </div>
         </div>`;
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
            $('#test_path_viewer').append(element);
        }
    }
);

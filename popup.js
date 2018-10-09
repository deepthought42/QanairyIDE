let startRecording = document.getElementById('startRecording');

startRecording.onclick = function(element) {
  //fire event to listen for url change events and action events


  chrome.runtime.sendMessage({recorder: "start"}, function(response) {
    console.log(response.status);
    alert(response.status);
  });

/*
  let color = element.target.value;
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(
        tabs[0].id,
        {code: 'document.body.style.backgroundColor = "' + color + '";'});
  });
  */
};

let stopRecording = document.getElementById('stopRecording');

stopRecording.onclick = function(element){
  //fire event to stop listening for url change events and action events
  chrome.runtime.sendMessage({recorder: "stop"}, function(response) {
    console.log(response.status);
    alert(response.status);
  });

  let color = element.target.value;
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(
        tabs[0].id,
        {code: 'document.body.style.backgroundColor = "' + color + '";'});
  });
}

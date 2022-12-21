document.getElementById('Stop_noBtn').addEventListener('click',()=>{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {greeting: "remove"}, function(response) {
        //  console.log(response.farewell);
        });
      });
      chrome.runtime.sendMessage({greeting: "stop"}, function(response) {
        console.log(response);
      })

})
document.getElementById('Stop_yesBtn').addEventListener('click',()=>{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {greeting: "remove"}, function(response) {
          console.log(response.farewell);
        });
      });
})
document.getElementById('noBtn').addEventListener('click',()=>{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {greeting: "remove"}, function(response) {
          console.log(response.farewell);
        });
      });
})
document.getElementById('yesBtn').addEventListener('click',()=>{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {greeting: "open-extension"}, function(response) {
          console.log(response.farewell);
        });
      });
})
let seconds = 1,
	mins = 0,
	hours = 0,
	Interval = null,
	tabStatus = false,
	myNotificationID = null,
	myNotificationIDS = null,
	recording = false,
	tabid = null,
	windowId = null,
	timeout = 0,
	left=null,
	top = null;


chrome.action.onClicked.addListener((tab) => {
		if (!tabStatus) {
			chrome.windows.create({
				url: chrome.runtime.getURL('popup.html'),
				focused: true,
				width: 320,
				height: 340,
				type: 'popup',
				top: 80,
				left: 1020
			}, (window) => {
				windowId = window.id
				setTimeout(() => {
					chrome.runtime.sendMessage({ greeting: "popupDetails", windowId: windowId }, function (response) {
					})
				}, 1000)
			})
			tabStatus = true
		} else {
			chrome.windows.update(
				windowId,
				{ focused: true }
			)
		}
})
self.addEventListener('message', async (event) => {
	if (event.data && event.data.type === 'close') {
		windowId = null;
		tabStatus = false
		chrome.tabs.query({ currentWindow: false }, function (tabs) {
			console.log(tabs);
			tabs.forEach(element => {
				chrome.tabs.sendMessage(element.id, { greeting: "removeDiv" }, function (response) {
				})
			});
		});
	}
	if (event.data && event.data.type === 'start') {
		chrome.tabs.query({}, function (tabs) {
			console.log(tabs);
			tabs.forEach((element)=>{
				chrome.tabs.sendMessage(element.id, {greeting:"start"}, function (response) {
				});
			})
		});
		clearInterval(Interval);
		Interval = setInterval(startTimer, 1000);
		recording = true;
		streamListener();
	}
	if (event.data && event.data.type === 'show-notification-stop') {
		chrome.notifications.create('NOTFICATION_IDS', {
			type: 'basic',
			iconUrl: 'camera.png',
			title: 'Screen Recorder',
			message: 'Would you like to continue recording ?',
			priority: 2,
			buttons: [
				{
					title: 'Yes'
				},
				{
					title: 'No'
				}
			]
		}, (id) => {
			myNotificationIDS = id;
		})
	}
	if (event.data && event.data.type === 'stop') {
		clearInterval(Interval);
		Interval = null;
		chrome.action.setBadgeText({ 'text': "" })
		seconds = 1, mins = 0; hours = 0;
		recording = false;
		left=null;
		top=null;
	}
	if (event.data && event.data.type === 'play') {
		if (!Interval)
			Interval = setInterval(startTimer, 1000);
	}
	if (event.data && event.data.type === 'pause') {
		clearInterval(Interval);
		Interval = null;
		chrome.action.setBadgeText({ 'text': "Paused" })
	}
	if (event.data && event.data.type === 'checkTab') {
		chrome.runtime.sendMessage({ greeting: "tabId", tabId: tabid }, function (response) {
			//console.log(response);
		})
	}
});
chrome.runtime.onMessage.addListener(
	async function (request, sender, sendResponse) {
		if (request.greeting == "wake") {
			//console.log("service worker");
		}
		if (request.greeting == "tabStatus") {
			sendResponse({ "tabStatus": tabStatus })
		}
		if (request.greeting == "div-position") {
			left=request.left;
			top = request.top;
			chrome.tabs.query({currentWindow:true,active:false}, function (tabs) {
				tabs.forEach((element, index) => {
					chrome.tabs.sendMessage(tabs[index].id, { greeting: 'div-position',left,top }, function (response) {
					})
				});
			});
		}
		if (request.greeting == "show-notification") {
			tabid = await getCurrentTab();
			//console.log(tabid.id);
			if (!tabStatus) {
				chrome.notifications.create('NOTFICATION_ID', {
					type: 'basic',
					iconUrl: 'camera.png',
					title: 'ATG MEET',
					message: 'Would you like to record the meeting ?',
					priority: 2,
					buttons: [
						{
							title: 'Yes'
						},
						{
							title: 'No'
						}
					]
				}, (id) => {
					myNotificationID = id;
				})
				tabListener()
			}
		}
		if (request.greeting === "open-from-popup") {
			if (!tabStatus) {
				chrome.windows.create({
					url: chrome.runtime.getURL('popup.html'),
					focused: true,
					width: 320,
					height: 340,
					type: 'popup',
					top: 80,
					left: 1020
				}, (window) => {
					windowId = window.id
				})
				tabStatus = true
			}
		}
		return true;
	})
chrome.notifications.onButtonClicked.addListener(function (notifId, btnIdx) {
	if (notifId === myNotificationID) {
		if (btnIdx === 0) {
			if (!tabStatus) {
				chrome.windows.create({
					url: chrome.runtime.getURL('popup.html'),
					focused: true,
					width: 320,
					height: 340,
					type: 'popup',
					top: 80,
					left: 1020
				}, (window) => {
					windowId = window.id
				})
				tabStatus = true
			}

		} else if (btnIdx === 1) {
			console.log("else block");
		}
	}
	if (notifId === myNotificationID) {
		if (btnIdx === 0) {
			console.log("else block");
		}
	} else if (btnIdx === 1) {
		chrome.runtime.sendMessage({ greeting: "stop" }, function (response) {
		})
	}
});
function startTimer() {
	var sec = seconds,
		minutes = mins,
		hour = hours;

	if (seconds < 10) {
		sec = "0" + seconds
	}
	if (mins < 10) {
		minutes = "0" + mins;
	}
	if (hours < 10) {
		hour = "0" + hours;
	}
	if (hours !== 0) {
		var text = hour + ":" + minutes;
	} else
		var text = minutes + ":" + sec;
	chrome.action.setBadgeText({ 'text': text })
	chrome.action.setBadgeBackgroundColor({ color: "red" });
	seconds++;

	if (seconds > 59) {
		mins++;
		seconds = 0;
	}
	if (mins > 59) {
		hours++;
		mins = 0;
	}

}
function streamListener() {
	const readyListener = () => {
		if (!tabStatus) {
			clearInterval(Interval)
			seconds = 1, mins = 0; hours = 0;
			chrome.action.setBadgeText({ 'text': "" })
		}
		return setTimeout(readyListener, 250);
	};
	readyListener();
}
function tabListener() {
	var Stop = false
	const readyListener = () => {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			chrome.tabs.sendMessage(tabid, { greeting: "checkMeetingTab" }, function (response) {
				if (!response) {
					if (recording) {
						chrome.notifications.create('NOTFICATION_IDS', {
							type: 'basic',
							iconUrl: 'camera.png',
							title: 'Screen Recorder',
							message: 'Would you like to continue recording ?',
							priority: 2,
							buttons: [
								{
									title: 'Yes'
								},
								{
									title: 'No'
								}
							]
						}, (id) => {
							myNotificationIDS = id;
						})
						Stop = true
					}
				}
			});
		});
		if (Stop) {
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				//console.log(tabs);
				chrome.tabs.sendMessage(tabs[0].id, { greeting: "close" }, function (response) {
					//console.log(response);
				});
			});
			return
		}
		return setTimeout(readyListener, 250);
	};
	readyListener();
}
async function getCurrentTab() {
	let queryOptions = { active: true, lastFocusedWindow: true };
	// `tab` will either be a `tabs.Tab` instance or `undefined`.
	let [tab] = await chrome.tabs.query(queryOptions);
	return tab;
}
function updateTabs(tabId, changeInfo, tab) {
	console.log(changeInfo);
	if (changeInfo.status == 'complete') {
		chrome.tabs.query({ active: true, currentWindow: false }, function (tabs) {
			let constraints={ greeting: "Inject"}
			if(recording)
			constraints={ greeting: "Inject",position:{left,top}}
			console.log(constraints);
			chrome.tabs.sendMessage(tab.id, constraints, function (response) {
				chrome.scripting.executeScript({
					target: { tabId: tab.id },
					files: ["timer.js", "dragFunction.js"]
				});
			});
		});
	}
}
chrome.tabs.onUpdated.addListener(updateTabs);
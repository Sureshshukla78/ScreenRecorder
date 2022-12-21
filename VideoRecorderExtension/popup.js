let stream = null,
	microphone = null,
	mixedStream = null,
	chunks = [],
	recorder = null,
	downloadButton = null,
	recordedVideo = null,
	cookieValue = null,
	recordingStatus = null,
	isUploading = null,
	isUploaded = null,
	links = null,
	user = null,
	blob = null,
	//tabid = null,
	percent_completed = null,
	permission = null,
	watchableLink = null,
	meetTab = null,
	db;
var seconds = 00;
var mins = 00;
var hours = 00;
var tabid = null;
var Interval;
let mute = null;
let windowId = null;
signUpBtn = document.querySelector(".sign-up");
homeBtn = document.querySelector(".home");
awsBtn = document.querySelector(".aws");
entireScreenBtn = document.getElementById("entireScreenBtn");
tabScreenBtn = document.getElementById('tabScreenBtn')
funcDiv = document.getElementById("func-div");
downBtn = document.getElementById('download-videos')
startButton = document.querySelector('.start-recording');
stopButton = document.querySelector('.stop-recording');
downloadButton = document.querySelector('.download-video');
recordedVideo = document.querySelector('.recorded-video');
let linkDiv = document.getElementById("link-div")
var pauseBtn = document.getElementById('pause')
var playBtn = document.getElementById('play')
var playPauseBtns = document.getElementById('playPauseBtns')
async function postData(url = '', data = {}) {
	// Default options are marked with *
	console.log("get data");
	const response = await fetch(url, {
		method: 'GET', // *GET, POST, PUT, DELETE, etc.
		headers: {
			//	  'auth':cookieValue
		},
		redirect: 'follow', // manual, *follow, error
		referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
		//body: data // body data type must match "Content-Type" header
	});
	return response.json(); // parses JSON response into native JavaScript objects
}

postData('http://localhost:3000/userDetails')
	.then((data) => {
		console.log(data);
		user = data
		var name = data.name
		document.getElementById('user').innerHTML = "Hey " + name
		document.getElementById('user').hidden = false
		homeBtn.hidden = false
		signUpBtn.hidden = true
		document.getElementById('last-recordings').hidden = false;
		funcDiv.hidden = false;
	});
navigator.serviceWorker.controller.postMessage({
	type: 'checkTab',
});

window.addEventListener('load', () => {
	const request = window.indexedDB.open("SCREEN-RECORDINGS", 3);
	request.onupgradeneeded = (event) => {
		db = event.target.result;

		db.onerror = (event) => {
			note.innerHTML += "<li>Error loading database.</li>";
		};

		// Create an objectStore for this database
		const objectStore = db.createObjectStore("recordings");
		// define what data items the objectStore will contain
	};
	request.onerror = (event) => {
		console.log("Couldn't connect to IDb");
	};
	request.onsuccess = (event) => {

		db = event.target.result;
		console.log('connected to IDb');
		console.log(request);
		listLastRecordedVideos();
	};
	signUpBtn.addEventListener('click', () => {
		chrome.tabs.create({ url: "http://localhost:3000/login" });
	})
	homeBtn.addEventListener('click', () => {
		chrome.tabs.create({ url: "http://localhost:3000/home" });
	})
	startButton.addEventListener('click', () => {
		linkDiv.hidden = true;
		document.getElementById('aws-text').hidden = true;
		mute = document.getElementById('mute').checked
		console.log(mute);
		startRecording()
	})
	stopButton.addEventListener('click', () => {
		recorder.stop();
		stopRecording();
	});
	playBtn.addEventListener('click', () => {
		play();
		pauseBtn.disabled = false;
		playBtn.disabled = true;
	})
	pauseBtn.addEventListener('click', () => {
		pause();
		playBtn.disabled = false;
		pauseBtn.disabled = true;
	})
	awsBtn.addEventListener('click', () => {
		//let cookieValue=localStorage.getItem('cookie')
		document.getElementById('save-rec').hidden = true;
		document.getElementById('stop-rec').hidden = true;
		document.getElementById('aws-text').innerHTML = "Uploading";
		document.getElementById('aws-text').hidden = false
		uploadToAws()
	})
	downloadButton.addEventListener('click', () => {
		document.getElementById("timer").hidden = true;
		document.getElementById("stop-rec").hidden = true;
		document.getElementById('aws-text').hidden = true;
		document.getElementById("save-rec").hidden = false;
	})
	entireScreenBtn.addEventListener('click', () => {
		entireScreenStatus = true;
		entireScreenBtn.classList.add('selected')
		tabScreenBtn.classList.remove('selected')
		if (!recordingStatus)
			startButton.disabled = false;
	})
	tabScreenBtn.addEventListener('click', () => {
		entireScreenStatus = false;
		tabScreenBtn.classList.add('selected')
		entireScreenBtn.classList.remove('selected')
		if (!recordingStatus)
			startButton.disabled = false;
	})
	chrome.runtime.onMessage.addListener(
		function (request, sender, sendResponse) {
			if (request.greeting === 'user') {
				if (!user) {
					user = request.data
					var name = user.name
					document.getElementById('user').innerHTML = "Hey " + name
					document.getElementById('user').hidden = false
					homeBtn.hidden = false
					signUpBtn.hidden = true
					funcDiv.hidden = false;
					if (blob) {
						downloadButton.classList.remove("disabled")
						awsBtn.disabled = false;
						document.getElementById("sign-in-alert").hidden = true;
					}
				}
			}
			if (request.greeting === "logout") {
				user = null;
				document.getElementById('user').hidden = true
				homeBtn.hidden = true
				signUpBtn.hidden = false
				funcDiv.hidden = false;
				downloadButton.classList.add("disabled")
				awsBtn.disabled = true;
				document.getElementById("timer").hidden = true;
				document.getElementById("stop-rec").hidden = true;
				document.getElementById('aws-text').hidden = true;
				document.getElementById("save-rec").hidden = true;
				linkDiv.hidden = true;
				window.resizeTo(320, 340);
			}
		}
	);
})
async function setupStream(constraints) {
	chrome.desktopCapture.chooseDesktopMedia(constraints, async function (streamId, object) {
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					mandatory: {
						chromeMediaSource: 'desktop',
						chromeMediaSourceId: streamId,
						minWidth: 1280,
						maxWidth: 1280,
						minHeight: 720,
						maxHeight: 720
					}
				},
				audio: {
					mandatory: {
						chromeMediaSource: 'desktop',
						chromeMediaSourceId: streamId,
					}
				}
			});
			if (!mute) {
				microphone = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: false,
				})
			}
			console.log(stream);
			record()
		}
		catch (err) {
			window.resizeTo(320, 340);
			console.error(err)
		}
	})
}

async function startRecording() {
	let constraints = ["screen", "window", "tab", "audio"];
	if (!entireScreenStatus)
		constraints = ["tab", "audio"];
	window.resizeTo(650, 650);
	await setupStream(constraints);
}
async function record() {
	if (stream) {
		if (!microphone) {
			console.log("recording with out mic");
			mixedStream = new MediaStream([...stream.getTracks(), ...stream.getAudioTracks()]);
		} else {
			const context = new AudioContext();
			if (stream.getAudioTracks().length) {
				console.log("recording with mic and system audio");
				console.log(stream.getAudioTracks().length);
				console.log(microphone);
				console.log("audio tracks");
				const source1 = context.createMediaStreamSource(stream);
				const source2 = context.createMediaStreamSource(microphone);
				const destination = context.createMediaStreamDestination();
				const desktopGain = context.createGain();
				const voiceGain = context.createGain();

				desktopGain.gain.value = 0.7;
				voiceGain.gain.value = 0.7;
				console.log(source1, source2, destination);
				source1.connect(desktopGain).connect(destination);
				// Connect source2
				source2.connect(voiceGain).connect(destination);
				mixedStream = new MediaStream([...stream.getVideoTracks(), ...destination.stream.getTracks()]);
			} else {
				console.log("no system audio");
				mixedStream = new MediaStream([...stream.getTracks(), ...microphone.getTracks()]);
			}
		}
		recorder = new MediaRecorder(mixedStream);
		recorder.ondataavailable = handleDataAvailable;
		recorder.onstop = handleStop;
		recorder.start(1000);
		console.log('Recording started');
		if (entireScreenStatus)
			constraints = { currentWindow: false }
		else
			constraints = { active: true, currentWindow: false }
		chrome.tabs.query(constraints, function (tabs) {
			tabs.forEach((element, index) => {
				//chrome.tabs.sendMessage(tabs[index].id, {greeting: "start"}, function(response) {
				chrome.scripting.executeScript({
					target: { tabId: tabs[index].id },
					files: ["callfunc.js"],
				});
			})
		});
		//});
		navigator.serviceWorker.controller.postMessage({
			type: 'start',
		});
		window.resizeTo(320, 340);
		recordingStatus = true;
		isUploaded = false;
		blob = null;
		links = null;
		clearInterval(Interval);
		document.getElementById('seconds').innerHTML = "0" + seconds;
		document.getElementById('mins').innerHTML = "0" + mins;
		document.getElementById('hours').innerHTML = "0" + hours;
		Interval = setInterval(startTimer, 1000);
		streamListener();
		startButton.disabled = true;
		stopButton.disabled = false;
		entireScreenBtn.hidden = true;
		tabScreenBtn.hidden = true;
		awsBtn.disabled = true;
		document.querySelector(".mute-checkBox").hidden = true;
		document.getElementById('last-recordings').hidden = true;
		downloadButton.hidden = false;
		document.getElementById("timer").hidden = false;
		document.getElementById('aws-text').hidden = true;
		document.getElementById("save-rec").hidden = true;
		document.getElementById("stop-rec").hidden = true;
	} else {
		window.resizeTo(320, 340);
		console.warn('No stream available.');
	}
}
function stopRecording() {
	clearInterval(Interval);
	seconds = 0, mins = 0; hours = 0;
	if (entireScreenStatus)
		constraints = { currentWindow: false }
	else
		constraints = { active: true, currentWindow: false }
	chrome.tabs.query(constraints, function (tabs) {
		console.log(tabs);
		tabs.forEach((element, index) => {
			chrome.tabs.sendMessage(tabs[index].id, { greeting: "removeDiv" }, function (response) {
			})
		});
	});
	// chrome.runtime.sendMessage({ greeting: "stop" }, function (response){
	// 	console.log("stop" + response);
	// })
	// chrome.tabs.sendMessage(meetTab, {greeting: "removeDiv"}, function(response) {
	// });
	navigator.serviceWorker.controller.postMessage({
		type: 'stop',
	});
	startButton.disabled = false;
	stopButton.disabled = true;
	entireScreenBtn.hidden = false;
	tabScreenBtn.hidden = false;
	recordingStatus = false;
	document.querySelector(".mute-checkBox").hidden = false;
	document.getElementById("timer").hidden = true;
	document.getElementById('aws-text').hidden = true;
	document.getElementById("save-rec").hidden = true;
	document.getElementById("stop-rec").hidden = false;
}
function pause() {
	navigator.serviceWorker.controller.postMessage({
		type: 'pause',
	});
	recorder.pause();
	clearInterval(Interval);
	Interval = null;
	console.log("recording paused");
}
function play() {
	navigator.serviceWorker.controller.postMessage({
		type: 'play',
	});
	recorder.resume();
	if (!Interval)
		Interval = setInterval(startTimer, 1000);
	console.log("recording played");
}

function handleDataAvailable(e) {
	chunks.push(e.data);
}

function handleStop(e) {
	blob = new Blob(chunks, { 'type': 'video/webm' });
	chunks = [];
	saveRecordings(blob);
	document.getElementById('last-recordings').hidden = false;
	console.log(blob);
	downloadButtonLink = URL.createObjectURL(blob);
	stream.getTracks().forEach((track) => track.stop());
	if (!mute)
		microphone.getTracks().forEach((track) => track.stop());

	downloadButton.href = downloadButtonLink
	downloadButton.download = 'video.mp4';
	if (user) {
		downloadButton.classList.remove("disabled")
		awsBtn.disabled = false;
	} else {
		document.getElementById("sign-in-alert").hidden = false;
	}

	console.log('Recording stopped');
}
function uploadToAws(recordedVideo, key) {
	let data = new FormData();
	if (recordedVideo)
		data.append('video', recordedVideo, 'video.mp4');
	else
		data.append('video', blob, 'video.mp4');
	isUploading = true;
	checkConnection()
	let request = new XMLHttpRequest();
	request.open('POST', 'http://localhost:3000/uploadVideo');
	//request.setRequestHeader("auth", cookieValue);
	//request.setRequestHeader('Content-Type', 'multipart/form-data');

	// upload progress event
	request.upload.addEventListener('progress', function (e) {
		// upload progress as percentage
		percent_completed = (e.loaded / e.total) * 100;
		var percentage = Math.round(percent_completed)
		document.getElementById('progress-bar').hidden = false;
		document.getElementById('progress').style.width = percentage + "%"
		document.getElementById('progress').innerHTML = percentage + "% completed"

	});
	// request finished event
	request.addEventListener('load', function (e) {
		// HTTP status message (200, 404 etc)
		isUploading = false;
		isUploaded = true;
		console.log(request.status);
		if (request.status != 200) {
			document.getElementById('aws-text').hidden = true;
			document.getElementById("err-msg").hidden = false;
			downloadButton.click();
			document.getElementById('save-rec').hidden = true;
			isUploading = false;
			window.resizeTo(320, 420);
		} else {
			// request.response holds response from the server
			links = JSON.parse(request.response);
			link = document.getElementById("link")
			link.innerText = links.watchableLink
			//link.href=links.watchableLink
			watchableLink = links.watchableLink;
			linkDiv.hidden = false;
			awsBtn.disabled = true;
			document.getElementById("link").target = "_blank"
			document.getElementById("link").href = 'https://' + watchableLink
			document.getElementById("stop-rec").hidden = true;
			document.getElementById("save-rec").hidden = true;
			document.getElementById('aws-text').innerHTML = "Uploaded to AWS";
			document.getElementById('aws-text').hidden = false
			document.getElementById('progress-bar').hidden = true;
			window.resizeTo(320, 460);
			if (recordedVideo) {
				const transaction = db.transaction(["recordings"], "readwrite");
				const objectStore = transaction.objectStore("recordings");
				const Delete = objectStore.delete(key);
				Delete.onsuccess = (event) => {
					console.log("deleted");
					listLastRecordedVideos();
				}
			}
		}
	});
	// send POST request to server
	request.send(data);
}
function startTimer() {
	seconds++;

	if (seconds <= 9) {
		document.getElementById('seconds').innerHTML = "0" + seconds;
	}

	if (seconds > 9) {
		document.getElementById('seconds').innerHTML = seconds;

	}

	if (seconds > 59) {
		mins++;
		document.getElementById('mins').innerHTML = "0" + mins;
		seconds = 0;
		document.getElementById('seconds').innerHTML = "0" + 0;
	}
	if (mins > 0 && mins < 10) {
		document.getElementById('mins').innerHTML = "0" + mins;
	}
	if (mins > 9) {
		document.getElementById('mins').innerHTML = mins;
	}
	if (mins > 59) {
		hours++;
		document.getElementById('hours').innerHTML = "0" + hours;
		mins = 0;
		document.getElementById('mins').innerHTML = "0" + 0;
	}
	if (hours > 0 && hours < 10) {
		document.getElementById('hours').innerHTML = "0" + hours;
	}
	if (hours > 9) {
		document.getElementById('hours').innerHTML = mins;
	}

}
function streamListener() {
	const readyListener = () => {
		if (!stream.active) {
			if (recordingStatus) {
				recordingStatus = false;
				recorder.stop();
				return stopRecording()
			} else {
				return
			}
		}
		return setTimeout(readyListener, 250);
	};
	readyListener();
}
function saveRecordings(blob) {
	const transaction = db.transaction(["recordings"], "readwrite");
	const objectStore = transaction.objectStore("recordings");
	const count = objectStore.count();
	count.onsuccess = (event) => {
		console.log(count.result);
		if (count.result > 5) {
			const req = objectStore.getAllKeys();
			req.onsuccess = (event) => {
				let index = req.result[0]
				const Delete = objectStore.delete(index);
				Delete.onsuccess = () => {
					getCountAndSave();
				}
			}
		} else
			getCountAndSave();
	}
	function getCountAndSave() {
		const req = objectStore.get('count')
		req.onerror = (event) => {
			console.log("error" + event);
		}
		req.onsuccess = (event) => {
			let count = req.result;
			if (count)
				save(count);
			else {
				const addCount = objectStore.add(1, 'count');
				addCount.onsuccess = (event) => save(1);
			}
		}
	}
	function save(count) {
		console.log('The value of count is ', count);
		const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		const d = new Date();
		let time = d.toLocaleTimeString();
		let day = `${weekday[d.getDay()]}-${time}`;
		let obj = { name: day, blob }
		const request = objectStore.put(obj, count)
		request.onsuccess = (event) => {
			listLastRecordedVideos();
			console.log('video saved succesfully');
			const incrementCount = objectStore.put(++count, 'count');
			incrementCount.onsuccess = (event) => console.log('count incremented ' + count);
		}
	}
}
function listLastRecordedVideos() {
	const transaction = db.transaction(["recordings"], "readwrite");
	const objectStore = transaction.objectStore("recordings");
	const keys = objectStore.getAllKeys()
	keys.onsuccess = (event) => {
		console.log(keys.result);
		const req = objectStore.getAll()
		req.onsuccess = (event) => {
			let div = document.getElementById('RecordedVideo');
			while (div.children[0])
				div.children[0].remove()
			req.result.forEach((element, index) => {
				console.log(element.name);
				if (element.name) {
					let div2 = document.createElement('div');
					let div3 = document.createElement('div');
					let p = document.createElement('p');
					div2.id = keys.result[index];
					let downloadBtn = document.createElement('a');
					let uploadBtn = document.createElement('a');
					downloadBtn.classList.add('btn-sm');
					uploadBtn.classList.add('btn-sm');
					uploadBtn.onmouseover = () => {
						uploadBtn.style.cursor = 'pointer';
					}
					uploadBtn.onclick = () => {
						uploadToAws(element.blob, keys.result[index]);
					}
					let downloadBtnLink = URL.createObjectURL(element.blob);
					downloadBtn.href = downloadBtnLink;
					downloadBtn.download = 'video.mp4';

					downloadBtn.innerHTML = `<i class="fa-solid fa-download icon-cog"></i>`
					uploadBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up icon-cog"></i>`
					div2.style.display = 'flex';
					div2.style.justifyContent = 'space-evenly';
					p.innerText = element.name;
					div3.appendChild(uploadBtn)
					div3.appendChild(downloadBtn)
					div2.appendChild(p)
					div2.appendChild(div3)
					div.appendChild(div2)
				}
			})
		}
	}
}
function checkConnection() {
	const readyListener = () => {
		if (isUploading) {
			if (navigator.onLine ? true : false) {
				//console.log("Online");
				return setTimeout(readyListener, 250);
			} else {
				//console.log("offline");
				document.getElementById('aws-text').hidden = true;
				document.getElementById("err-msg").hidden = false;
				downloadButton.click();
				document.getElementById('save-rec').hidden = true;
				isUploading = false;
				window.resizeTo(320, 420);
			}
		} else
			return;


	};
	readyListener();
}
window.addEventListener('beforeunload', function (e) {
	navigator.serviceWorker.controller.postMessage({
		type: 'close',
	});
});
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.greeting == "popupDetails") {
			windowId = request.windowId;
		}
		if (request.greeting == "exit") {
			sendResponse({ msg: "stillOpen" })
		}
		if (request.greeting == "tabId") {
			tabid = request.tabId
		}
		if (request.greeting == "stop") {
			stopButton.click()
		}
		if (request.greeting == "recordingStatus") {
			recorder.state == "paused" ? sendResponse({ status: false, timer: { seconds: seconds, mins: mins, hours: hours } }) : sendResponse({ status: true, timer: { seconds: seconds, mins: mins, hours: hours } })
		}
		if (request.greeting == "playAndPause") {
			chrome.tabs.query({}, function (tabs) {
				tabs.forEach((element, index) => {
					chrome.tabs.sendMessage(tabs[index].id, { greeting: 'playAndPause', function: request.function }, function (response) {
					})
				});
			});
			if (request.function == "play") {
				play();
			}
			if (request.function == "pause") {
				pause();
			}
		}
		if (request.greeting == "trash") {
			stopRecording();
		}
		return true;
	})
let urls = RegExp("https://meet.google.com/*/");
function updateTabs(tabId, changeInfo, tab) {
	if (tabId == tabid && recordingStatus) {
		if (changeInfo.status == "complete" && !urls.test(tab.url)) {
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				chrome.tabs.sendMessage(tabid, { greeting: "close" }, function (response) {
					//console.log(response);
				});
			});
			navigator.serviceWorker.controller.postMessage({
				type: 'show-notification-stop',
			});
		}
	}
	if (recordingStatus && changeInfo.status == 'complete' && entireScreenStatus) {
		setTimeout(() => {
			chrome.tabs.query({ active: true }, function (tabs) {
				tabs.forEach((element, index) => {
					chrome.scripting.executeScript({
						target: { tabId: tabs[index].id },
						files: ["callfunc.js"]
					});
				})
			});
		}, 100)
	}
}
chrome.tabs.onUpdated.addListener(updateTabs);

document.getElementById('copyButton').addEventListener('click', () => {
	var copyText = document.getElementById("link");
	navigator.clipboard.writeText('http://' + copyText.innerText);
	document.getElementById('linkCopiedText').hidden = false;
	setTimeout(() => {
		document.getElementById('linkCopiedText').hidden = true;
	}, 3000)
})
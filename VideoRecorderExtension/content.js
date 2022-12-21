var tabid = null;
let cookieValue = true
let user = null;
let recordingStatus = false;
const urlOne = RegExp("https://meet.google.com/_meet/")
const urlTwo = RegExp("https://meet.google.com/\[a-z]")
if (urlTwo.test(location.href) || urlOne.test(location.href)) {
	chrome.runtime.sendMessage({ greeting: "tabStatus" }, function (response) {
		if (!response.tabStatus)
			injectIframe("notification.html");
	})
	chrome.runtime.sendMessage({ greeting: "show-notification" }, function (response) {
		console.log(response);
	})
}
setInterval(() => {
	chrome.runtime.sendMessage({ greeting: "wake" }, function (response) {
	})
}, 1000)
if (location.href == 'https://meet.atg.party/home') {
	async function postData(url = '', data = {}) {
		// Default options are marked with *
		//console.log("get data");
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

	postData('https://meet.atg.party/userDetails')
		.then((data) => {
			user = data
			if (data) {
				chrome.runtime.sendMessage({ greeting: "user", data }, function (response) {
					console.log(response);
				})
			}
		});
}
if (location.href == "https://meet.atg.party/") {
	console.log("logout");
	chrome.runtime.sendMessage({ greeting: "logout" }, function (response) {
		console.log(response);
	})
}
chrome.runtime.onMessage.addListener(
	async function (request, sender, sendResponse) {
		if (request.greeting === "user") {
			console.log(user);
			sendResponse()
		}
		if (request.greeting === "start") {
			console.log("started");
			recordingStatus = true;
		}
		if (request.greeting === "Inject") {
			if (request.position)
				injectDiv("timer.html", request.position);
			else
				injectDiv("timer.html");

		}
		if (request.greeting === "close") {
			injectIframe("stopNotification.html");
			sendResponse({ status: true })
		}
		if (request.greeting === "checkMeetingTab") {
			sendResponse({ status: true })
		}
		if (request.greeting === "remove") {
			var ifrm = document.getElementById('iframe');
			document.body.removeChild(ifrm);
		}
		if (request.greeting === "removeDiv") {
			recordingStatus = false;
			var div = document.getElementById('mydiv');
			div.remove();
			injectDiv("timer.html")
		}
		if (request.greeting === "open-extension") {
			var ifrm = document.getElementById('iframe');
			document.body.removeChild(ifrm);
			chrome.runtime.sendMessage({ greeting: "open-from-popup" }, function (response) {
				console.log(response);
			})
		}
		if (request.greeting == "playAndPause") {
			console.log(request.function);
			if (request.function == "play") {
				shadow_root = document.getElementById('mydiv').shadowRoot
				shadow_root.getElementById('play').click();
			}
			if (request.function == "pause") {
				shadow_root = document.getElementById('mydiv').shadowRoot
				shadow_root.getElementById('pause').click();
			}
		}
		if (request.greeting == "div-position") {
			shadow_root = document.getElementById('mydiv').shadowRoot
			shadow_root.getElementById('mydivheader').style.top = `${request.top}px`;
			shadow_root.getElementById('mydivheader').style.left = `${request.left}px`;
		}
	}
)
function injectIframe(file) {
	var ifrm = document.createElement("iframe");
	ifrm.src = chrome.runtime.getURL(file);
	ifrm.style.zIndex = 99999;
	ifrm.style.width = "20rem";
	ifrm.style.height = "15rem";
	ifrm.style.position = "fixed";
	ifrm.style.backgroundColor = "#fff";
	ifrm.style.left = "35%";
	ifrm.style.top = "25%";
	ifrm.id = "iframe";
	ifrm.style.boxShadow = "0 0 10px #625df5"
	document.body.appendChild(ifrm);
}
function injectDiv(file, position) {
	var div = document.createElement("ATG-RECORDER");
	div.id = "mydiv"
	div.innerHTML = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css"
	integrity="sha512-KfkfwYDsLkIlwQp6LFnl8zNdLGxu9YAA1QvwINks4PhcElQSvqcyVLLD9aMhXd13uQjoXtEKNosOWaZqXgel0g=="
	crossorigin="anonymous" referrerpolicy="no-referrer" />
	<style>
@import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,200;0,600;1,200;1,300&display=swap');
</style>`
	div.hidden = true
	document.body.insertAdjacentElement("beforebegin", div);
	const shadowRoot = document.getElementById('mydiv').attachShadow({ mode: 'open' })
	let style = document.createElement('style');
	let span = document.createElement('span');
	style.textContent = `
	@import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,200;0,600;1,200;1,300&display=swap');

	:root {
		--1ns: 0.5rem;
	}

	#mydivheader {
		position: fixed;
		display: flex;
		z-index: 99999;
		align-items: center;
		justify-content: space-evenly;
		width: calc(20* var(--1ns, 8px));
		height: calc(5* var(--1ns, 8px));
		background-color: #393939;
		border-radius: 16px;
		top: 90%;
		left: calc(20* var(--1ns, 8px));
		pointer-events: all;
	}

	div.playbtn{
		border-radius: 50%;
		margin: 10px;
		display: flex;
		cursor: pointer;
	}
	.active{
		animation: 1s hideshow ease-in-out infinite;
	}
	@keyframes hideshow {
		0% { opacity: 1; }
		50% { opacity: 0; }
		100% { opacity: 1; }
	} 
	#mydivheader:hover {
		cursor: move
	}

    #playPauseBtns,#timer{
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
	}
	
	#draggable-div {
		position: fixed;
		height: 100vh;
		width: 100vw;
		background-color: transparent;
		pointer-events: none;
		z-index: 999999;
		font-size: 16px;
		font-family: 'Josefin Sans', sans-serif;
	}

	.bar{
		height: 15px;
		width: 3px;
		border-radius: 4px;
		background-color: #FFF;
	}
	
	.sep{
		position: relative;
		left: 9px;
		height: 25px;
		top: 1px;
		background-color: #717171;
	}`
	span.innerHTML = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css"
	integrity="sha512-KfkfwYDsLkIlwQp6LFnl8zNdLGxu9YAA1QvwINks4PhcElQSvqcyVLLD9aMhXd13uQjoXtEKNosOWaZqXgel0g=="
	crossorigin="anonymous" referrerpolicy="no-referrer" />
<div id="draggable-div">
	<div id="mydivheader">
		<div class="playbtn" onclick="document.querySelector('svg circle#blink').classList.toggle('active')">
			<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle class="" id="blink" cx="15" cy="15" r="14.2694" stroke="#FF6273" stroke-width="1.46129"/>
				<ellipse cx="15.0003" cy="15.0003" rx="12.2093" ry="12.2093" fill="#FF6273"/>
			</svg>				
		</div>
		<div id="timer" style="width: calc(6 * var(--1ns,8px));position: relative;top: calc(0.7 * var(--1ns,8px) - 3px)">
			<p style="margin:0;color: white;"><span style="color: white;font-size:16px" id="hours"></span><span
					style="color: white;font-size:16px" id="mins">00</span>:<span style="color: white;font-size:16px"
					id="seconds">00</span></p>
		</div>
		<div class="bar sep"></div>&nbsp;&nbsp;&nbsp;
		<div id="playPauseBtns" class="pb-2" style="margin-top:calc(0.3 * var(--1ns,8px));">
			<button title="Play" id="play" style="    height: 25px;
				border: 1px solid;
				width: 27px;
				display: none;
				border-radius: 13px;">
				<i class="fa-solid fa-play"></i>
			</button>
			<button title="Pause" id="pause" style="outline:none;display: flex;min-width: 15px;gap:4px;border:none;background:transparent;">    
				<div class="bar"></div>
				<div class="bar"></div>
			</button>
		</div>
		<div class="trash">
			<i style="color:white;padding: 10px;" class="fa-regular fa-trash-can"></i>
		</div>
		<button id="req-time" hidden></button>
	</div>
</div>`
	shadowRoot.appendChild(style);
	shadowRoot.appendChild(span);
	if (position) {
		console.log(position);
		var shadow_root = document.getElementById('mydiv').shadowRoot
		shadow_root.getElementById('mydivheader').style.top = `${position.top}px`;
		shadow_root.getElementById('mydivheader').style.left = `${position.left}px`;
	}

}
document.addEventListener("visibilitychange", (event) => {
	if (document.visibilityState == "visible") {
		if (recordingStatus) {
			setTimeout(() => {
				document.getElementById('mydiv').hidden = false
			}, 1000)
			var shadow_root = document.getElementById('mydiv').shadowRoot
			shadow_root.getElementById('req-time').click()
			console.log("tab is active")
		}
	} else {
		console.log("tab is inactive")
		document.getElementById('mydiv').hidden = true
	}
});
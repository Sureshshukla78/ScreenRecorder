let seconds = 0,
	mins = 0,
	hours = 0,
	Interval = null;
	function start() {
	document.getElementById('mydiv').hidden = false
	shadow_root = document.getElementById('mydiv').shadowRoot
	var pauseBtn = shadow_root.getElementById('pause')
	var playBtn = shadow_root.getElementById('play')
	var trash = shadow_root.querySelector('.trash')
	var playPauseBtns = shadow_root.getElementById('playPauseBtns')
	var reqTime = shadow_root.getElementById('req-time')
	reqTime.onclick = ()=>{

		chrome.runtime.sendMessage({ greeting: "recordingStatus" }, function (response) {
			if (response.status) {
			clearInterval(Interval);
			Interval = null;
			seconds = response.timer.seconds;
			mins = response.timer.mins
			hours = response.timer.hours
			Interval = setInterval(startTimer, 1000);
		}
		else {
			seconds = response.timer.seconds
			mins = response.timer.mins
			hours = response.timer.hours
			shadow_root.getElementById('seconds').innerText = seconds;
			shadow_root.getElementById('mins').innerText = mins;
			shadow_root.getElementById('hours').innerText = hours
			playBtn.disabled = false;
			pauseBtn.disabled = true;
			pauseBtn.style.display = 'none';
			playBtn.style.display = '';
		}
	})
}
reqTime.click();
	chrome.runtime.onMessage.addListener(
		function (request, sender, sendResponse) {
			if (request.greeting == "playandpausefrompopup") {
				if (request.function == 'pause') {
					playBtn.disabled = false;
					pauseBtn.disabled = true;
					clearInterval(Interval)
					Interval = null;
				} else {
					playBtn.disabled = true;
					pauseBtn.disabled = false
					if (!Interval)
						Interval = setInterval(startTimer, 1000);
				}
			}
		})
	playBtn.addEventListener('click', () => {
		chrome.runtime.sendMessage({ greeting: "playAndPause", function: "play" }, function (response) {
		})
		Interval = setInterval(startTimer, 1000);
		pauseBtn.disabled = false;
		playBtn.disabled = true;
		pauseBtn.style.display = 'flex';
		playBtn.style.display = 'none';
	})
	pauseBtn.addEventListener('click', () => {
		chrome.runtime.sendMessage({ greeting: "playAndPause", function: "pause" }, function (response) {
		})
		clearInterval(Interval);
		playBtn.disabled = false;
		pauseBtn.disabled = true;
		pauseBtn.style.display = 'none';
		playBtn.style.display = '';
	})
	trash.addEventListener('click', () => {
		var confirmation=confirm('do you want to delete this video ?');
		if(confirmation){
			chrome.runtime.sendMessage({ greeting: "trash" }, function (response) {
			})
		}
	})
	function startTimer() {
		seconds++;
		if (!shadow_root.getElementById('seconds')) {
			return
		}
		if (seconds <= 9) {
			shadow_root.getElementById('seconds').innerHTML = "0" + seconds;
		}

		if (seconds > 9) {
			shadow_root.getElementById('seconds').innerHTML = seconds;

		}

		if (seconds > 59) {
			mins++;
			shadow_root.getElementById('mins').innerHTML = "0" + mins;
			seconds = 0;
			shadow_root.getElementById('seconds').innerHTML = "0" + 0;
		}
		if (mins > 0 && mins < 10) {
			shadow_root.getElementById('mins').innerHTML = "0" + mins;
		}
		if (mins > 9) {
			shadow_root.getElementById('mins').innerHTML = mins;
		}
		if (mins > 59) {
			hours++;
			shadow_root.getElementById('hours').innerHTML = "0" + hours;
			mins = 0;
			shadow_root.getElementById('mins').innerHTML = "0" + 0;
		}
		if (hours > 0 && hours < 10) {
			shadow_root.getElementById('hours').innerHTML = "0" + hours;
		}
		if (hours > 9) {
			shadow_root.getElementById('hours').innerHTML = mins;
		}

	}
}
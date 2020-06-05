const { ipcRenderer } = require('electron')
const { BrowserWindow } = require('electron').remote

const elements = {
	launchBarProgress: id('launchBarProgress'),
	launchButton: id('launchButton'),
	settingsButton: id('settingsButton'),
	close: id('close'),
	minimize: id('minimize'),
	user: id('user')
}

let settingsWin = null

let renderInterval

let downloading = false
let settingsOpen = false

let progress = 0
let width = 0

let webIP = 'localhost'
let webPort = 3000

// We received a new download progress value
ipcRenderer.on('progress', (event, arg) => {
	progress = Math.round(arg * 100)
})

// Render the download progress bar
function renderProgressBar() {
	if (width >= 100) {
		clearInterval(renderInterval)
		downloading = false

		new Notification('Update Complete', {
			body: 'Client is now up-to-date.'
		})
		return
	}

	if (progress > width) {
		width = round(lerp(width, progress, progress / 100), 2)
		elements.launchBarProgress.style.width = width + '%'
	}

	elements.launchButton.textContent = progress + '%'
}

// Menu Buttons
elements.close.addEventListener('click', () => {
	BrowserWindow.getFocusedWindow().close()
})

elements.minimize.addEventListener('click', () => {
	BrowserWindow.getFocusedWindow().minimize()
})

elements.settingsButton.addEventListener('click', () => {
	if (settingsOpen) {
		return
	}

	settingsOpen = true

	settingsWin = new BrowserWindow({
		width: 400,
		height: 300,
		title: 'Settings',
		show: false,
		frame: false,
		parent: BrowserWindow.fromId(1),
		modal: true,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true
		}
	})

	settingsWin.on('ready-to-show', () => {
		settingsWin.moveTop()
		settingsWin.show()
	})

	settingsWin.on('closed', () => {
		settingsWin = null
		settingsOpen = false
	})

	settingsWin.loadFile('../src/settings.html')
})

// Launch Button
elements.launchButton.addEventListener('click', () => {
	if (downloading) { // Only launch if not downloading anything
		return
	}

	let platform = 'win'
	let version = 'latest'

	// Tell the main process what to download
	/* TEST FILES 
	 * http://ipv4.download.thinkbroadband.com/5MB.zip
	 * http://ipv4.download.thinkbroadband.com/10MB.zip
	 * http://ipv4.download.thinkbroadband.com/20MB.zip
	 * http://ipv4.download.thinkbroadband.com/50MB.zip
	 */
	ipcRenderer.send('download-button', { url: 'http://ipv4.download.thinkbroadband.com/5MB.zip' })
	//ipcRenderer.send('download-button', { url: `http://${webIP}:${webPort}/api/releases/${platform}/${version}.zip` })
	
	// Reset values
	width = 0
	progress = 0
	elements.launchBarProgress.style.width = '0'

	// Indicate that we are now downloading
	downloading = true

	// Start rendering the download progress bar every 10ms
	renderInterval = setInterval(renderProgressBar, 10)
})

function lerp(start, end, amt) {
	return (1 - amt) * start + amt * end
}

// EXPERIMENTAL FOCUS CODE FOR SETTINGS WINDOW
/*document.addEventListener('mousemove', () => {
	if (settingsOpen) {
		settingsWin.focus()
	}
})*/
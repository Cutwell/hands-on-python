const clientID = Date.now();;
var ws;
var selectedCode;
var terminalNotification = false;
const userTableBody = document.getElementById("userTableBody");
const terminalDiv = document.getElementById("terminal");

// Form Parent
const form = document.querySelector(".code_input");

// Form Inputs
const formInputs = form.querySelectorAll("input");

// Returns the code which is inputted into each of the form inputs
const inputCode = () => {
	let code = [];
	formInputs.forEach(function (input) {
		code.push(input.value);
	});

	return code.join("");
};

// Checks the code which is returned from inputCode()
const validateCode = () => {
	const c = inputCode();
	if (c.length === 4) {
		document.querySelector(".show-connect-button").style.display = "block";
	} else {
		form.classList.add("error");
		form.classList.remove("success");
		return false;
	}
};

// Clears out all the inputs and sets the focus to the first one
const clearInputs = () => {
	formInputs[0].focus();
	formInputs.forEach(function (input) {
		input.value = "";
	});
	form.className = "";
};

// Initiates code validation if the key pressed isn't backspace or delete
formInputs.forEach(function (input, index, array) {
	input.addEventListener("input", function (event) {
		let inputLength = input.value.length;

		if (event.inputType !== "deleteContentBackward" && inputLength === 1) {
			if (index < array.length - 1) {
				array[index + 1].focus();
			} else {
				validateCode();
			}
		} else if (event.inputType === "deleteContentBackward" && inputLength === 0) {
			if (index > 0) {
				array[index - 1].focus();
			}
		}
	});
});

// Clears form when clicking any of the form inputs
formInputs.forEach(function (input) {
	input.addEventListener("click", function () {
		clearInputs();
	});
});

function processMessage(event) {
	let usersData = JSON.parse(event.data).loc;
	let terminalMessages = JSON.parse(event.data).terminal;

	// Reconstruct the entire table from scratch
	userTableBody.innerHTML = "";
	updateUsersTable(usersData);

	// Update the terminal
	updateTerminal(terminalMessages);
}

function updateUsersTable(usersData) {
	let codeRow = document.createElement('tr');
	let readyRow = document.createElement('tr');

	for (let userID in usersData) {
		if (usersData.hasOwnProperty(userID)) {
			let userData = usersData[userID];

			// Create td elements for codeRow
			let codeCell = document.createElement('td');
			let codeBlock = document.createElement('code')
			codeBlock.textContent = userData.code;
			codeBlock.setAttribute("data-bs-toggle", "tooltip");
			codeBlock.setAttribute("data-bs-placement", "top");

			// Create td element for readyRow
			let readyCell = document.createElement('td');
			readyCell.textContent = userData.ready ? "✔" : "⏳";
			readyCell.setAttribute("data-bs-toggle", "tooltip");
			readyCell.setAttribute("data-bs-placement", "top");
			
			// Customise if this code is the user's own input
			if (userID == clientID) {
				codeBlock.classList.add('green-code')
				codeBlock.title = `Your code!`;
				readyCell.title = `You!`;
			} else {
				codeBlock.classList.add('black-code')
				codeBlock.title = `User ${userID}'s code`;
				readyCell.title = `User ${userID}`;
			}

			codeCell.appendChild(codeBlock);
			codeRow.appendChild(codeCell);
			readyRow.appendChild(readyCell);
		}
	}

	// Append codeRow and readyRow to userTableBody
	userTableBody.appendChild(codeRow);
	userTableBody.appendChild(readyRow);
}

function updateTerminal(messages) {
	if (messages.length > 0) {
		// add terminal notification
		document.getElementById("terminal-notification-dot").style.display = "block";
		
		// Add each message to the terminal
		messages.forEach(function (message) {
			addMessageToTerminal(message);
		});
	}
}

function hideTerminalNotificationDot() {
	document.getElementById("terminal-notification-dot").style.display = "none";
}

function addMessageToTerminal(message) {
	// Add a new line to the terminal
	let line = document.createElement("p");
	line.className = "line1";
	//line.innerHTML = "> " + message + '<span class="cursor1">_</span>';
	line.innerHTML = "> " + message;
	terminalDiv.appendChild(line);

	// Automatically scroll to the bottom
	document.getElementById("fakeTerminal").scrollTop = document.getElementById("fakeTerminal").scrollHeight;
}

function connectToWebSocket() {
	let selectedRoom = inputCode();

	if (selectedRoom >= 1 && selectedRoom <= 9999) {
		ws = new WebSocket(`ws://localhost:8000/ws/${clientID}/${selectedRoom}`);

		ws.onmessage = processMessage;

		// Hide the room input and show the main UI
		document.getElementById("roomcode").style.display = "none";
		document.getElementById("main").style.display = "block";

		// show selected room
		document.getElementById("roomcode-number").innerHTML = selectedRoom;
		document.getElementById("roomcode-subheader").style.display = "block";

	} else {
		alert("Please enter a valid room number (1 - 9999).");
	}
}

function updateCode() {
	let message = {
		type: "code",
		value: selectedCode
	};

	ws.send(JSON.stringify(message));
}

function runCode() {
	let message = {
		type: "run",
		value: true
	};

	ws.send(JSON.stringify(message));
}

function clearme() {
	selectedCode = "";
	// update server
	updateCode();
}

function sendMessage(event) {
	// Additional logic for sending messages if needed
	event.preventDefault();
}

var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})

function setCode(value) {
	selectedCode = value;
	document.getElementById("dropdownMenuButtonText").innerHTML = `Selected code: <code class="white-code">${value}</code>`
	updateCode();
}

function getStringInput() {
	// Prompt the user for input
	var userInput = prompt("Enter custom string:");

	// Check if the user canceled the prompt (input is null)
	if (userInput !== null) {
		userInput = '"' + userInput.replace(/"/g, '\\"') + '"';
		setCode(userInput);
	} else {
		clearme();
	}
}

function getNumberInput() {
    // Prompt the user for input
    var userInput = prompt("Enter a number:");

    // Check if the user canceled the prompt or entered a non-numeric value
    if (userInput !== null && !isNaN(userInput)) {
        setCode(userInput);
    } else {
        clearme();
    }
}

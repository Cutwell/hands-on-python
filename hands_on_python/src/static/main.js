Array.prototype.includes = function (value) {
	return this.indexOf(value) !== -1
}
String.prototype.characterize = function (callback) {
	var characters = this.split('');
	var options = {};

	for (var i = 0; i < this.length; i++) {
		options = callback(characters[i]);
	}
}

var $keywords = ['False', 'None', 'True', 'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'];
var $functions = ['abs', 'dict', 'help', 'min', 'setattr', 'all', 'dir', 'hex', 'next', 'slice', 'any', 'divmod', 'id', 'object', 'sorted', 'ascii', 'enumerate', 'input', 'oct', 'staticmethod', 'bin', 'eval', 'int', 'open', 'str', 'bool', 'exec', 'isinstance', 'ord', 'sum', 'bytearray', 'filter', 'issubclass', 'pow', 'super', 'bytes', 'float', 'iter', 'print', 'tuple', 'callable', 'format', 'len', 'property', 'type', 'chr', 'frozenset', 'list', 'range', 'vars', 'classmethod', 'getattr', 'locals', 'repr', 'zip', 'compile', 'globals', 'map', 'reversed', '_import_', 'complex', 'hasattr', 'max', 'round', 'delattr', 'hash', 'memoryview', 'set'];


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
			let codeBlock = document.createElement('pre');

			let tokens = tokenize(userData.code);
			codeBlock.innerHTML = '';
			for (var i = 0; i < tokens.length; i++) {
				let token = tokens[i];
				let span = document.createElement('span');
				span.className = 'highlight-' + token.type;
				span.innerText = token.value;
				codeBlock.appendChild(span);
			}

			codeBlock.setAttribute("data-bs-toggle", "tooltip");
			codeBlock.setAttribute("data-bs-placement", "top");

			// Create td element for readyRow
			let readyCell = document.createElement('td');
			readyCell.textContent = userData.ready ? "✔" : "⏳";
			readyCell.setAttribute("data-bs-toggle", "tooltip");
			readyCell.setAttribute("data-bs-placement", "top");

			// Customise if this code is the user's own input
			if (userID == clientID) {
				codeBlock.title = `Your code!`;
				readyCell.title = `You!`;
			} else {
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

function tokenize(inputString) {
	var tokens = [];
	var lexedValue = '';
	var currentToken = null;

	function newSpaceToken() {
		currentToken = { type: 'space', value: ' ' };
		lexedValue = '';
	}

	function parseLexedValueToToken() {
		if (lexedValue) {
			if ($keywords.includes(lexedValue)) {
				tokens.push({ type: 'keyword', value: lexedValue })
			} else if ($functions.includes(lexedValue)) {
				tokens.push({ type: 'function', value: lexedValue })
			} else if (lexedValue !== '') {
				if (isNaN(lexedValue)) {
					tokens.push({ type: 'default', value: lexedValue })
				} else {
					tokens.push({ type: 'number', value: lexedValue })
				}
			}
			lexedValue = '';
		}
	}

	function lex(char) {
		if (char !== ' ' && currentToken && currentToken.type === 'space') {
			tokens.push(currentToken);
			lexedValue = '';
			currentToken = null;
		}

		switch (char) {
			case ' ':
				if ($keywords.includes(lexedValue)) {
					tokens.push({ type: 'keyword', value: lexedValue })
					newSpaceToken();
				} else if ($functions.includes(lexedValue)) {
					tokens.push({ type: 'function', value: lexedValue })
					newSpaceToken();
				} else if (lexedValue !== '') {
					if (isNaN(lexedValue)) {
						tokens.push({ type: 'default', value: lexedValue })
					} else {
						tokens.push({ type: 'number', value: lexedValue })
					}
					newSpaceToken();
				} else if (currentToken) {
					currentToken.value += ' '
				} else {
					newSpaceToken();
				}
				break;

			case '"':
			case '\'':
				if (currentToken) {
					if (currentToken.type === 'string') {
						if (currentToken.value[0] === char) {
							currentToken.value += char
							tokens.push(currentToken)
							currentToken = null;
						} else {
							currentToken.value += char
						}
					} else if (currentToken.type === 'comment') {
						currentToken.value += char
					}
				} else {
					if (lexedValue) {
						tokens.push({ type: 'default', value: lexedValue });
						lexedValue = '';
					}
					currentToken = { type: 'string', value: char }
				}
				break;

			case '=':
			case '+':
			case '-':
			case '*':
			case '/':
			case '%':
			case '&':
			case '|':
			case '>':
			case '<':
			case '!':
				if (currentToken) {
					currentToken.value += char;
				} else {
					parseLexedValueToToken();
					tokens.push({ type: 'operator', value: char })
				}
				break;

			case '#':
				if (currentToken) {
					currentToken.value += char;
				} else {
					parseLexedValueToToken();
					currentToken = { type: 'comment', value: char }
				}
				break;

			case ':':
				if (currentToken) {
					currentToken.value += char;
				} else {
					parseLexedValueToToken();
					tokens.push({ type: 'colon', value: char });
				}
				break;

			case '(':
				if (currentToken) {
					currentToken.value += char;
				} else {
					parseLexedValueToToken();
					tokens.push({ type: 'left-parentheses', value: char });
				}
				break;

			case ')':
				if (currentToken) {
					currentToken.value += char;
				} else {
					parseLexedValueToToken();
					tokens.push({ type: 'right-parentheses', value: char });
				}
				break;

			case '[':
				if (currentToken) {
					currentToken.value += char;
				} else {
					parseLexedValueToToken();
					tokens.push({ type: 'left-bracket', value: char });
				}
				break;

			case ']':
				if (currentToken) {
					currentToken.value += char;
				} else {
					parseLexedValueToToken();
					tokens.push({ type: 'right-bracket', value: char });
				}
				break;

			case ',':
				if (currentToken) {
					currentToken.value += char;
				} else {
					parseLexedValueToToken();
					tokens.push({ type: 'comma', value: char });
				}
				break;

			case '\n':
				if (currentToken) {
					switch (currentToken.type) {
						case 'string':
						case 'comment':
							tokens.push(currentToken)
							currentToken = null;
							break;
						default:
					}
				} else {
					parseLexedValueToToken();
					lexedValue = '';
				}
				tokens.push({ type: 'newline', value: '\n' });
				break;

			case ';':
				if (currentToken) {
					currentToken.value += char;
				} else {
					parseLexedValueToToken();
					tokens.push({ type: 'semicolon', value: char });
				}
				break;

			default:
				if (currentToken) {
					currentToken.value += char;
				} else {
					lexedValue += char
				}

				break;
		}
	}

	/* Lexing the input codes */
	inputString.characterize(lex);

	/* Rest of the lexed value or token which is unfinished */
	parseLexedValueToToken();

	if (currentToken) tokens.push(currentToken)

	/* Secondary Parse to Match Some Patterns */
	var isFunctionArgumentScope = false;
	var tokenCount = tokens.length;
	for (var i = 0; i < tokenCount; i++) {
		var token = tokens[i];
		if (token.type === 'keyword' && (token.value === 'def' || token.value === 'class')) {
			var peekToken = tokens[i + 2]
			if (peekToken && peekToken.type === 'default') peekToken.type = 'function-name';
		} else if (token.type === 'default' && isFunctionArgumentScope) {
			token.type = 'argument';
		} else if (token.type === 'left-parentheses') {
			var peekToken = tokens[i - 1]
			if (peekToken && peekToken.type === 'function-name') isFunctionArgumentScope = true;
		} else if (token.type === 'right-parentheses') {
			isFunctionArgumentScope = false;
		}
	}

	return tokens
}


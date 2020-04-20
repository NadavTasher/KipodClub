window.chatID = null;

function load() {
    // Initialize pull loop to checkout every 10 seconds
    Pull.initialize(10);
    // Set title
    showLoading();
    // Load chats
    loadChats();
    // Load product
    loadProduct();
    // Start reload interval
    setInterval(loadChat, 5 * 1000);
}

/**
 * Creates the chat from the user inputs.
 */
function clickCreateChat() {
    let name = prompt("What's the chat name?", "My kipod chat");
    // Make sure length is longer than 0
    if (name === null || name.length === 0)
        return;
    let recipient = prompt("Who's the recipient?", "Shuky");
    // Make sure length is longer than 0
    if (recipient === null || recipient.length === 0)
        return;
    showLoading();
    // Validate and create chat
    API.call("chat", "createChat", {
        name: name,
        recipient: recipient,
        token: Authenticate.token
    }, (status, result) => {
        if (status) {
            loadChat(result, () => setTitle(name));
        }
    });
}

/**
 * Scrolls to the bottom of the message list.
 */
function clickScrollChat() {
    let list = UI.find("message-list");
    list.scrollTo(0, list.scrollHeight);
}

/**
 * Sends a text message from the user inputs.
 */
function clickSendText() {
    let input = UI.find("message-input-text");
    if (input.value.length > 0) {
        // Send the message
        API.call("chat", "sendText", {
            chat: chatID,
            content: input.value,
            token: Authenticate.token
        }, () => loadChat(chatID));
        // Empty the input
        input.value = "";
    }
}

/**
 * Sends a url message (image).
 */
function clickSendImage() {
    let input = prompt("Image URL", "images/icons/icon.png");
    if (input.length > 0) {
        // Send the message
        API.call("chat", "sendImage", {
            chat: chatID,
            content: input,
            token: Authenticate.token
        }, () => loadChat(chatID));
    }
}

/**
 * Loads the chat list.
 */
function loadChats() {
    API.call("chat", "listChats", {
        token: Authenticate.token
    }, (success, result) => {
        if (success) {
            setTitle("Chats");
            // List chats
            let chatList = UI.find("home-list");
            // Clear list
            UI.clear(chatList);
            // Add chats
            for (let chatObject of result) {
                chatList.appendChild(UI.create("chat-view", {
                    id: chatObject.id,
                    name: chatObject.name
                }));
            }
            // View the home page
            UI.view("home-page");
        }
    });
}

/**
 * Loads the product status.
 */
function loadProduct() {
    if (Authority.validate(Authenticate.token, ["kipod_club_premium"])[0]) {
        // Enable the image button
        UI.show("message-send-image");
        // Set product sticker
        setProduct(true);
    } else {
        // Enable the image button
        UI.hide("message-send-image");
        // Set product sticker
        setProduct(false);
    }
}

/**
 * Loads the message list.
 * @param chatID Chat ID
 * @param callback Callback function
 */
function loadChat(chatID = window.chatID, callback = null) {
    if (chatID !== null) {
        window.chatID = chatID;
        // Fetch new messages
        API.call("chat", "listMessages", {
            chat: chatID,
            token: Authenticate.token
        }, (success, result) => {
            if (success) {
                // Fetch user ID
                let tokenValidation = Authority.validate(Authenticate.token);
                if (tokenValidation[0]) {
                    let userID = tokenValidation[1];
                    let messageList = UI.find("message-list");
                    // Clear
                    UI.clear(messageList);
                    // Add messages
                    for (let message of result) {

                        // Create a date object to be used for the time label
                        let date = new Date(message.timestamp * 1000);

                        // Function to prepend a 0 to timestamps
                        let wrapTime = (number) => {
                            return (number < 10) ? "0" + number : number;
                        };

                        // Is the sender the current user?
                        let isMe = message.sender === userID;

                        // Check if the message is an image message
                        if (message.type === "text") {
                            messageList.appendChild(UI.create("message-block-text", {
                                align: isMe ? "end" : "start",
                                text: message.content,
                                time: wrapTime(date.getHours()) + ":" + wrapTime(date.getMinutes())
                            }));
                        } else {
                            messageList.appendChild(UI.create("message-block-image", {
                                align: isMe ? "end" : "start",
                                url: message.content,
                                time: wrapTime(date.getHours()) + ":" + wrapTime(date.getMinutes())
                            }));
                        }
                    }
                }
                UI.view("chat-page");
                // Callback
                if (callback !== null)
                    callback();
            }
        });
    }
}

/**
 * Shows a loading screen.
 */
function showLoading() {
    UI.view("loading-page");
}

/**
 * Sets the bar's text.
 * @param title Title
 */
function setTitle(title) {
    UI.find("title").innerText = title;
}

/**
 * Sets the bar's version text.
 * @param paid Payment status
 */
function setProduct(paid = false) {
    if (paid) {
        // Enable extra features
        UI.show("message-send-image");
        // Set text
        UI.find("product").innerText = "Paid version";
    } else {
        // Disable extra features
        UI.hide("message-send-image");
        // Set text
        UI.find("product").innerText = "Free version";
    }
    UI.find("product").setAttribute("paid", paid.toString());
}

function testBuy() {
    fetch("/apis/shop/?buyProduct&app=kipod_club_premium&token=" + Authenticate.token);
}
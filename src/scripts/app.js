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
    // Load the special elevated (purchased) UI
    loadUI();
    // Start reload interval
    setInterval(loadChat, 5 * 1000);
}

/**
 * Opens the new chat page.
 */
function newChat() {
    setTitle("New chat");
    UI.view("new-page");
}

/**
 * Creates the chat from the user inputs.
 */
function finalizeChat() {
    let name = UI.find("new-name").value;
    let participants = UI.find("new-recipient").value;
    // Validate and create chat
    if (name.length > 0 && participants.length > 0) {
        UI.find("new-name").value = "";
        UI.find("new-recipient").value = "";
        createChat(name, participants);
    }
}

/**
 * Scrolls to the bottom of the message list.
 */
function scrollMessage() {
    let list = UI.find("message-list");
    list.scrollTo(0, list.scrollHeight);
}

/**
 * Sends a message from the user inputs.
 */
function finalizeMessage() {
    let message = UI.find("message-input").value;
    if (message.length > 0) {
        UI.find("message-input").value = "";
        sendMessage(chatID, message);
    }
}

/**
 * Creates a new chat.
 * @param name Chat name
 * @param recipient Recipient name
 */
function createChat(name, recipient) {
    API.call("chat", "createChat", {
        name: name,
        recipient: recipient,
        token: Authenticate.token
    }, (status, result) => {
        if (status) {
            showLoading();
            setTitle(name);
            loadChat(result, scrollMessage);
        }
    });
}

/**
 * Sends a message.
 * @param chatID Chat ID
 * @param message Message
 */
function sendMessage(chatID, message) {
    API.call("chat", "sendMessage", {
        chat: chatID,
        message: message,
        token: Authenticate.token
    }, () => loadChat(chatID));
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
            let chatList = UI.find("chat-list");
            // Clear list
            UI.clear(chatList);
            // Add chats
            for (let chatObject of result) {
                chatList.appendChild(UI.create("chat-button", {
                    id: chatObject.id,
                    name: chatObject.name
                }));
            }
            // View the home page
            UI.view("chats-page");
        }
    });
}

/**
 * Loads the product status.
 */
function loadProduct() {
    let isPremium = Authority.validate(Authenticate.token, ["kipod_club_premium"])[0];
    if (isPremium) {
        setProduct("Paid", true);
    } else {
        setProduct("Free", false);
    }
    return isPremium;
}

/**
 * Loads the special UI elements
 */
function loadUI() {
    if (!loadProduct()){
        UI.hide();
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

                        // Is the sender the current user?
                        let isMe = message.authorID === userID;

                        // Create a date object to be used for the time label
                        let date = new Date(message.creationTime * 1000);

                        // Function to prepend a 0 to timestamps
                        let wrapTime = (number) => {
                            return (number < 10) ? "0" + number : number;
                        };

                        // Check if the message is an image message
                        if (!message.hasOwnProperty("imageURL")) {
                            messageList.appendChild(UI.create("message-block-text", {
                                align: isMe ? "end" : "start",
                                text: message.messageText,
                                time: wrapTime(date.getHours()) + ":" + wrapTime(date.getMinutes())
                            }));
                        } else {
                            messageList.appendChild(UI.create("message-block-image", {
                                align: isMe ? "end" : "start",
                                text: message.messageText,
                                time: wrapTime(date.getHours()) + ":" + wrapTime(date.getMinutes()),
                                url: message.imageURL
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
 * @param name Version
 * @param paid Payment status
 */
function setProduct(name, paid = false) {
    UI.find("product").setAttribute("paid", paid.toString());
    UI.find("product").innerText = name + " version";
}
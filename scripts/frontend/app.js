const KIPOD_API = "kipod";
const KIPOD_ENDPOINT = "scripts/backend/kipod/kipod.php";

let userID = null;

function load(loggedIn, userInfo) {
    view("app");
    if (loggedIn) {
        userID = userInfo.id;
        view("home");
        load_chats();
        load_search();
        load_chart();
    } else {
        view("nologin");
    }
}

function load_chart() {
    api(KIPOD_ENDPOINT, KIPOD_API, "chart", {}, (success, result, error) => {
        let view = get("chart-list");
        for (let key in result) {
            if (key in result) {
                let thing = make("div");
                row(thing);
                let name = make("p", key);
                let value = make("p", result[key] + " Kipods");
                thing.appendChild(name);
                thing.appendChild(value);
                view.appendChild(thing);
            }
        }
    }, accounts_fill());
}

function load_chats() {
    api(KIPOD_ENDPOINT, KIPOD_API, "chats", {}, (success, result, error) => {
        let list = get("chats-list");
        for (let i = 0; i < result.length; i++) {
            let button = make("button", result[i].name);
            button.name = result[i].name;
            button.person = false;
            button.onclick = () => {
                load_chat(result[i].id);
                page("chats", "chat");
            };
            list.appendChild(button);
        }
    }, accounts_fill());
}

function load_search() {
    let list = get("chats-list");
    api(KIPOD_ENDPOINT, KIPOD_API, "list", {}, (success, result, error) => {
        for (let i = 0; i < result.length; i++) {
            let button = make("button", "New chat with " + result[i].name);
            button.name = result[i].name;
            button.person = true;
            button.onclick = () => {
                new_chat([result[i].id, userID], (success, result, error) => {
                    if (success) {
                        load_chat(result);
                        page("chats", "chat");
                    }
                });
            };
            hide(button);
            list.appendChild(button);
        }
    }, accounts_fill());
}

function load_chat(id) {
    let update = () => api(KIPOD_ENDPOINT, KIPOD_API, "read", {chat: id}, (success, result, error) => {
        let bubbles = get("chat-contents");
        clear(bubbles);
        if (success) {
            for (let i = 0; i < result.length; i++) {
                let current = result[i];
                let message = make("div", null, ["message"]);
                let text = make("p", current.content);
                let sender = make("p", current.sender);
                let kipod = make("img");
                let top = make("div");
                row(top);
                column(message);
                kipod.src = "images/icons/app/icon.png";
                kipod.onclick = () => {
                    api(KIPOD_ENDPOINT, KIPOD_API, "kipod", {chat: id, message: current.id}, update, accounts_fill());
                };
                sender.style.margin = "0.1vh";
                sender.style.padding = "0.1vh";
                sender.style.fontSize = "2vh";
                top.appendChild(sender);
                top.appendChild(kipod);
                if (current.me) {
                    message.style.alignSelf = "flex-end";
                    if (current.kipod) {
                        message.style.backgroundColor = "#aa9080";
                    } else {
                        message.style.backgroundColor = "#80aa80";
                    }
                    hide(kipod);
                } else {
                    message.style.alignSelf = "flex-start";
                    if (current.kipod) {
                        hide(kipod);
                        message.style.backgroundColor = "#d7b9a8";
                    } else {
                        message.style.backgroundColor = "#ffffff";
                    }
                    message.appendChild(top);
                }
                message.appendChild(text);
                bubbles.appendChild(message);
            }
        }
        bubbles.scrollTo(0, bubbles.scrollHeight);
    }, accounts_fill());
    get("chat-send").onclick = () => {
        if (get("chat-text").value.length > 0) {
            api(KIPOD_ENDPOINT, KIPOD_API, "write", {chat: id, content: get("chat-text").value}, (success) => {
                if (success) get("chat-text").value = "";
                update();
            }, accounts_fill());
        }
    };
    update();
    setInterval(update, 2000, 0);
}

function new_chat(participants, callback) {
    api(KIPOD_ENDPOINT, KIPOD_API, "chat", {
        participants: participants
    }, callback, accounts_fill());
}

function search(text) {
    let children = get("chats-list").children;
    for (let c = 0; c < children.length; c++) {
        if (text.length > 0) {
            if (children[c].name.toLowerCase().includes(text.toLowerCase())) {
                show(children[c]);
            } else {
                hide(children[c]);
            }
        } else {
            if (children[c].person) {
                hide(children[c]);
            } else {
                show(children[c]);
            }
        }
    }
}

function send() {

}
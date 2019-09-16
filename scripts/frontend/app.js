const KIPOD_API = "kipod";
const KIPOD_ENDPOINT = "scripts/backend/kipod/kipod.php";

function load(loggedIn) {
    view("app");
    if (loggedIn)
        view("home");
    else
        view("nologin");
}

function load_chats() {
    api(KIPOD_ENDPOINT, KIPOD_API, "chats", {}, (success, result, error) => {
        let list = get("chats-list");
        for(let i = 0; i<result.length; i++){
            let button = make("button","Chat with "+result[i].name);
            button.onclick=()=>{

            };
            list.appendChild(button);
        }
    }, accounts_fill());
}

function load_search() {

}
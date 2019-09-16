function load(loggedIn) {
    view("app");
    if (loggedIn)
        view("home");
    else
        view("nologin");
}

// App Code
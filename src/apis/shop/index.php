<?php

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "authenticate" . DIRECTORY_SEPARATOR . "api.php";

Authenticate::initialize();

Base::handle(function ($action, $parameters) {
    if (isset($parameters->token)) {
        if (is_string($parameters->token)) {
            // Check authentication
            $authentication = Authenticate::validate($parameters->token);
            if ($authentication[0]) {
                // Init the manager
                Manager::initialize();
                // Overtake the database
                $database = new Database(Authenticate::API);
                // Store user ID
                $userID = $authentication[1];
                if ($action === "buyProduct") {
                    if (isset($parameters->app) && is_string($parameters->app)) {
                        $permissions = array();
                        // Try reading the permissions
                        if (($permissionsData = $database->get($userID, Authenticate::COLUMN_PERMISSIONS))[0]) {
                            $permissions = json_decode($permissionsData[1]);
                        }
                        // Push to the array
                        array_push($permissions, $parameters->app);
                        // Save to database
                        $database->set($userID, Authenticate::COLUMN_PERMISSIONS, json_encode($permissions));
                        // Notify the user
                        Manager::push($userID, "New item purchased!", "You now have access to \"" . $parameters->app . "\"");
                        // Return success
                        return [true, "You owe me money"];
                    }
                    return [false, "Missing parameter"];
                }
                return [false, "Unknown hook"];
            }
            return $authentication;
        }
        return [false, "Invalid token"];
    }
    return [false, "Missing token"];
});
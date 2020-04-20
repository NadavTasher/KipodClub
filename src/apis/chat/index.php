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
                // Store user ID
                $userID = $authentication[1];
                // Initialize database
                $usersDatabase = new Database("users");
                $chatsDatabase = new Database("chats");
                $usersDatabase->createColumn("chats");
                $chatsDatabase->createColumn("name");
                $chatsDatabase->createColumn("messages");
                $chatsDatabase->createColumn("recipients");
                // Make sure user exists
                ensure_user_integrity($usersDatabase, $userID);
                // Parse action
                if ($action === "createChat") {
                    if (isset($parameters->name) && is_string($parameters->name) &&
                        isset($parameters->recipient) && is_string($parameters->recipient)) {
                        // Create chat
                        $chatID = $chatsDatabase->createRow()[1];
                        $chatsDatabase->set($chatID, "name", $parameters->name);
                        $chatsDatabase->set($chatID, "messages", json_encode(array()));
                        $chatsDatabase->set($chatID, "recipients", json_encode(array()));
                        ensure_chat_integrity($chatsDatabase, $chatID);
                        // Add & notify participants
                        $addedParticipants = array($userID);
                        $recipientID = bin2hex($parameters->recipient);
                        if ($recipientID !== $userID) {
                            // Read chats
                            ensure_user_integrity($usersDatabase, $recipientID);
                            // Fetch chats
                            $chats = json_decode($usersDatabase->get($recipientID, "chats")[1]);
                            // Modify array
                            array_push($chats, $chatID);
                            // Push chats
                            $usersDatabase->set($recipientID, "chats", json_encode($chats));
                            // Add to participants
                            array_push($addedParticipants, $recipientID);
                            // Notify user
                            Manager::push($recipientID, $parameters->name . " - " . hex2bin($userID) . " started a chat.");
                        } else {
                            Manager::push($userID, "You cant add yourself.");
                        }
                        // Save participants
                        $chatsDatabase->set($chatID, "recipients", json_encode($addedParticipants));
                        // Add to owner's list
                        // Fetch chats
                        $chats = json_decode($usersDatabase->get($userID, "chats")[1]);
                        // Modify array
                        array_push($chats, $chatID);
                        // Push chats
                        $usersDatabase->set($userID, "chats", json_encode($chats));
                        // Notify user
                        Manager::push($userID, $parameters->name . " - Chat has been created.");
                        // Return OK
                        return [true, $chatID];
                    }
                    return [false, "Parameter error"];
                } else if ($action === "sendText" || $action === "sendImage") {
                    if (isset($parameters->chat) && is_string($parameters->chat) &&
                        isset($parameters->content) && is_string($parameters->content)) {
                        // Fetch chats
                        $chatID = $parameters->chat;
                        $chats = json_decode($usersDatabase->get($userID, "chats")[1]);
                        // Make sure we have permission
                        if (array_search($chatID, $chats) !== false) {
                            // Ensure integrity
                            ensure_chat_integrity($chatsDatabase, $chatID);
                            // Read messages
                            $messages = json_decode($chatsDatabase->get($chatID, "messages")[1]);
                            // Create a new message
                            $messageObject = new stdClass();
                            $messageObject->sender = $userID;
                            $messageObject->type = ($action === "sendText" ? "text" : "image");
                            $messageObject->content = $parameters->content;
                            $messageObject->timestamp = time();
                            // Push to array
                            array_push($messages, $messageObject);
                            // Write messages
                            $chatsDatabase->set($chatID, "messages", json_encode($messages));
                            // Notify participants
                            foreach (json_decode($chatsDatabase->get($chatID, "recipients")[1]) as $recipientID) {
                                if ($recipientID !== $userID)
                                    Manager::push($recipientID, $chatsDatabase->get($chatID, "name")[1] . " - New message");
                            }
                            return [true, "Message sent"];
                        }
                        return [false, "You must be in the chat to write a message"];
                    }
                    return [false, "Parameter error"];
                } else if ($action === "listChats") {
                    // Initialize the result array
                    $chats = array();
                    // Fetch user's chats
                    $chatIDs = json_decode($usersDatabase->get($userID, "chats")[1]);
                    // Fetch chat names
                    foreach ($chatIDs as $chatID) {
                        // Ensure chat integrity
                        ensure_chat_integrity($chatsDatabase, $chatID);
                        // Create chat object
                        $chatObject = new stdClass();
                        $chatObject->id = $chatID;
                        $chatObject->name = $chatsDatabase->get($chatID, "name")[1];
                        // Push to array
                        array_push($chats, $chatObject);
                    }
                    return [true, $chats];
                } else if ($action === "listMessages") {
                    if (isset($parameters->chat) && is_string($parameters->chat)) {
                        // Ensure the user has sufficient permissions
                        $chatID = $parameters->chat;
                        $chats = json_decode($usersDatabase->get($userID, "chats")[1]);
                        if (array_search($chatID, $chats) !== false) {
                            // Ensure integrity
                            ensure_chat_integrity($chatsDatabase, $chatID);
                            // Load messages
                            return [true, json_decode($chatsDatabase->get($chatID, "messages")[1])];
                        }
                        return [false, "Insufficient permissions"];
                    }
                    return [false, "Parameter error"];
                }
                return [false, "Unknown action"];
            }
            return $authentication;
        }
        return [false, "Invalid token"];
    }
    return [false, "Missing token"];
});

/**
 * Ensures a user's integrity.
 * @param Database $database
 * @param string $id
 */
function ensure_user_integrity($database, $id)
{
    if (!$database->hasRow($id)[0]) {
        $database->createRow($id);
    }
    if (!$database->isset($id, "chats")[0]) {
        $database->set($id, "chats", json_encode(array()));
    }
}

/**
 * Ensures a chat's integrity.
 * @param Database $database
 * @param string $id
 */
function ensure_chat_integrity($database, $id)
{
    if (!$database->hasRow($id)[0]) {
        $database->createRow($id);
    }
    if (!$database->isset($id, "name")[0]) {
        $database->set($id, "name", "A chat");
    }
    if (!$database->isset($id, "messages")[0]) {
        $database->set($id, "messages", json_encode(array()));
    }
    if (!$database->isset($id, "recipients")[0]) {
        $database->set($id, "recipients", json_encode(array()));
    }
}
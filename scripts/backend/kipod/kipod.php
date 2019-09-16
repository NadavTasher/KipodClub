<?php

include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "base" . DIRECTORY_SEPARATOR . "api.php";
include_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "accounts" . DIRECTORY_SEPARATOR . "api.php";

const KIPOD_API = "kipod";
const KIPOD_CHAT_DATABASE = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "kipod" . DIRECTORY_SEPARATOR . "chats.json";
const KIPOD_CHART_DATABASE = __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "files" . DIRECTORY_SEPARATOR . "kipod" . DIRECTORY_SEPARATOR . "kipods.json";

$chat_database = null;
$chart_database = null;

api(KIPOD_API, function ($action, $parameters) {
    $user = accounts();
    if ($user !== null) {
        // Load databased only if passed authentication.
        kipod_load();
        $results = [false, "No such action"];
        if ($action === "chat") {
            if (isset($parameters->participants)) {
                return kipod_chat($user->id, $parameters->participants);
            } else {
                return [false, "Missing parameters"];
            }
        } else if ($action === "write") {
            if (isset($parameters->chat) && isset($parameters->content)) {
                return kipod_message($parameters->chat, $user->id, $parameters->content);
            } else {
                return [false, "Missing parameters"];
            }
        } else if ($action === "read") {
            if (isset($parameters->chat)) {
                return kipod_messages($user->id, $parameters->chat);
            } else {
                return [false, "Missing parameters"];
            }
        } else if ($action === "chats") {

        } else if ($action === "kipod") {

        } else if ($action === "list") {

        } else if ($action === "chart") {

        }
        kipod_save();
        return $results;
    } else {
        return [false, "Authentication error"];
    }
}, true);

echo json_encode($result);

function kipod_chat($user, $user_ids)
{
    global $chat_database;
    $id = random(20);
    $chat = new stdClass();
    $chat->id = $id;
    $chat->name = null;
    $chat->participants = kipod_sanitize_uid_list($user_ids);
    $chat->messages = array();
    $chat_database->$id = $chat;
    kipod_message($id, $user, "Hello there!");
    return [true, $id];
}

function kipod_messages($uid, $id)
{
    global $chat_database;
    if (isset($chat_database->$id)) {
        $translation_table = kipod_translation_table($chat_database->$id->participants);
        $chat = new stdClass();
        $messages = array();
        foreach ($chat_database->$id->messages as $chat_message) {
            if (isset($translation_table->{$chat_message->sender})) {
                $message = new stdClass();
                $message->id = $chat_message->id;
                $message->sender = $translation_table->{$chat_message->sender};
                $message->kipod = $chat_message->kipod;
                $message->content = $chat_message->content;
                array_push($messages, $message);
            }
        }
        return [true, $messages];
    }
    return [false, "No such chat"];
}

function kipod_message($id, $sender, $text)
{
    global $chat_database;
    if (isset($chat_database->$id)) {
        // Sender is a participant
        if (array_search($sender, $chat_database->$id->participants, true) !== false) {
            $message = new stdClass();
            $message->id = random(64);
            $message->sender = $sender;
            $message->content = $text;
            $message->kipod = false;
            array_push($chat_database->$id->messages, $message);
            return [true, $message->$id];
        }
        return [false, "No such participant"];
    }
    return [false, "No such chat"];
}

function kipod_kipod($chat, $id)
{
    global $chat_database;
    if (isset($chat_database->$chat)) {
        foreach ($chat_database->$chat->messages as $message) {
            if ($message->$id === $id) {
                $message->kipod = true;
                return [true, null];
            }
        }
        return [false, "No such message"];
    }
    return [false, "No such chat"];
}

function kipod_sanitize_uid_list($uid_list)
{
    global $accounts_database;
    $array = array();
    foreach ($uid_list as $uid) {
        if (isset($accounts_database->$uid))
            array_push($array, $uid);
    }
    return $array;
}

function kipod_translation_table($participants)
{
    global $accounts_database;
    $table = new stdClass();
    foreach ($participants as $participant) {
        if (isset($accounts_database->$participant)) {
            $table->$participant = $accounts_database->$participant->name;
        }
    }
    return $table;
}

function kipod_save()
{
    global $chat_database, $chart_database;
    file_put_contents(KIPOD_CHAT_DATABASE, json_encode($chat_database));
    file_put_contents(KIPOD_CHART_DATABASE, json_encode($chart_database));
}

function kipod_load()
{
    global $chat_database, $chart_database;
    $chat_database = json_decode(file_get_contents(KIPOD_CHAT_DATABASE));
    $chart_database = json_decode(file_get_contents(KIPOD_CHART_DATABASE));
}
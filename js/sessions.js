$(function () {
    initializeFirebase();
    sessions();
});

function initializeFirebase() {
    var config = {
        apiKey: "AIzaSyBw1XF-Jbkz3DV8mANU_SQgYYq-wErVZfQ",
        authDomain: "devconf-cz-2017.firebaseapp.com",
        databaseURL: "https://devconf-cz-2017.firebaseio.com",
        storageBucket: "devconf-cz-2017.appspot.com",
        messagingSenderId: "88312300184"
    };

    firebase.initializeApp(config);
}

function sessions() {

    // Global variables -----------------------------------------------------------------------------------------------

    var rooms = {};
    var tracks = {};
    var speakers = [];
    var sessions = [];

    // Init -----------------------------------------------------------------------------------------------------------

    retrieveRooms();

    // http://materializecss.com/modals.html#initialization
    $('.modal').modal();

    // -- HTML Triggers -----------------------------------------------------------------------------------------------

    $("body")
        .on("click", ".session", function (event) {
            event.stopImmediatePropagation();
            var sessionId = $(this).attr("id");
            if (sessionId) {
                showSessionModal(sessions[sessionId]);
            }
        });

    // -- Helper methods ----------------------------------------------------------------------------------------------

    /**
     * Retrieve all rooms from database
     */
    function retrieveRooms() {
        var roomsRef = firebase.database().ref().child("rooms").orderByChild("name");

        roomsRef.once('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                var room = childSnapshot.val();
                rooms[room.name.toUpperCase()] = room;
            });

            createTableHeader();

            retrieveTracks();
            retrieveSpeakers();
            retrieveSessions();
        });
    }

    /**
     * Retrieve all tracks from database
     */
    function retrieveTracks() {
        var tracksRef = firebase.database().ref().child("tracks");

        tracksRef.once('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                var track = childSnapshot.val();
                tracks[track.name.toUpperCase()] = track;
            });
            createTrackFilter();
        });
    }

    /**
     * Retrieve all speakers from databse
     */
    function retrieveSpeakers() {
        var speakersRef = firebase.database().ref().child("speakers").orderByChild("name");

        speakersRef.once('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                var speaker = childSnapshot.val();
                speakers[speaker.id] = speaker;
            });
        });
    }

    function retrieveSessions() {
        var sessionsRef = firebase.database().ref().child("sessions").orderByChild("start");

        sessionsRef.once('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                var session = childSnapshot.val();
                sessions[session.id] = session;
                addSessionInTable(session);
            });
        });
    }

    /**
     * Create table header based in available rooms
     */
    function createTableHeader() {
        var html = "<tr><th></th>";
        for (var key in rooms) {
            html += "<th>" + rooms[key].name + "</th>";
        }

        $("table.day1 > thead").append(html);
        $("table.day2 > thead").append(html);
        $("table.day3 > thead").append(html);
    }

    function createTrackFilter() {
    }

    /**
     * Add the session in the table cell
     *
     * @param session Session
     */
    function addSessionInTable(session) {

        var html;

        if (session.type.toLowerCase() == "talk") {

            var timeslot = session.start.replace(/\s+/g, '-').replace(/:/g, '-');
            var hour = timeslot.split("-")[0];
            var minute = timeslot.split("-")[1];

            if (!$("tr." + timeslot).length) {
                html = "<tr class='" + timeslot + "'>" +
                    "<td class='session-time'>" +
                    "<span class='session-hour'>" + hour + "</span>" +
                    "<span class='session-minute'>" + minute + "</span>" +
                    "</td>";

                for (key in rooms) {
                    html += "<td class='session hoverable " + rooms[key].name.toUpperCase() + "'></td>"
                }
                html += "</tr>";
                $("table.day" + session.day + " > tbody:last-child").append(html);
            }

            html = "<div class='session-title'>" + session.title + "</div>" +
                "<div class='hide-on-med-and-down session-track'><i class='tiny material-icons'>local_offer</i>" + session.track + "</div>";
            var td = $("table.day" + session.day + " tr." + timeslot).find("td." + session.room.toUpperCase());
            td.attr("id", session.id);

            // Check if there is track in the session (database have sessions without track)
            if (session.track) {
                td.addClass(session.track.toUpperCase());
                // Check if there is a color for this track in the database
                if(tracks[session.track.toUpperCase()]) {
                    td.css("background-color", tracks[session.track.toUpperCase()].color);
                }
            }
            td.html(html);

        }

    }

    /**
     * Show the session detail
     *
     * @param session Session
     */
    function showSessionModal(session) {

        var modal = $("#session-detail");
        var content = modal.find(".modal-content");
        var footer = modal.find(".modal-footer");

        content.find("h5").text(session.title);
        content.find(".session-description").html(session.description);
        content.find(".session-speakers").empty();
        content.find(".session-speakers").append(getSpeakers(session.speakers));
        content.find(".session-info .session-track").text(session.track);
        content.find(".session-info .session-room").text(session.room);

        modal.modal('open');

    }

    function getSpeakers(speakersId) {
        var s = "";
        for (i = 0; i < speakersId.length; i++) {
            var speaker = speakers[speakersId[i]];
            s += speaker.name;
            if (speakersId.length - 1 > i) {
                s += " & ";
            }
        }
        return s;
    }

}

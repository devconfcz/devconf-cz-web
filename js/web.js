$(function () {
    initializeFirebase();
    speakers();
    session();
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

// -- Speakers --------------------------------------------------------------------------------------------------------

function speakers() {

    // -- HTML Triggers -----------------------------------------------------------------------------------------------

    $("body")
    // Show/Hide speaker bio when click on speaker photo
        .on("click", ".card-image--speaker", function (event) {
            event.stopImmediatePropagation();

            $(this).parent().find('.card-content--speaker').slideToggle();
        })
        // Hide speaker bio when click on speaker bio
        .on("click", ".card-content--speaker", function (event) {
            event.stopImmediatePropagation();

            $(this).slideToggle();
        });

    // -- Firebase Database Triggers ----------------------------------------------------------------------------------

    var speakersRef = firebase.database().ref().child("speakers");

    speakersRef.orderByChild("name").on('child_added', function (snapshot) {
        addNewSpeakerCard(snapshot.val(), snapshot.key);
    });

    // -- Helper methods ----------------------------------------------------------------------------------------------

    function addNewSpeakerCard(speaker, id) {
        var html = "<div class='card card--speaker hoverable " + id + "'>" +
            "<div class='card-image card-image--speaker' style='background-image: url(\"" + speaker.avatar + "\")'>" +
            "<span class='card-title card-title--speaker'>" + speaker.name + "</span>" +
            "</div>" +
            "<div class='card-content card-content--speaker'>" +
            speaker.bio +
            "</div>";
        // Card Actions
        // html += "<div class='card-action card-action--speaker'>";
        // if (speaker.twitter) {
        //     html += "<a href='http://twitter.com/" + speaker.twitter + "'>" +
        //         "<img src='assets/icons/twitter-icon.png' width='40px' height='40px' />" +
        //         "</a>";
        // }
        // html += "</div>";

        $('.speakers-container').append(html);
    }

}

function session() {

    // Init -----------------------------------------------------------------------------------------------------------

    // Local cache of all sessions
    var sessions = [];
    var speakers = [];

    // All available rooms
    var rooms = ["D105", "D205", "D206", "C228", "E105", "E112", "E104", "G202"];

    // http://materializecss.com/modals.html#initialization
    $('.modal').modal();

    createTableHeader(rooms);

    // -- HTML Triggers -----------------------------------------------------------------------------------------------

    $("body")
        .on("click", ".session", function (event) {
            event.stopImmediatePropagation();
            var sessionId = $(this).attr("id");
            if (sessionId) {
                showSessionModal(sessions[sessionId]);
            }
        });

    // -- Firebase Database Triggers ----------------------------------------------------------------------------------

    var sessionsRef = firebase.database().ref().child("sessions").orderByChild("start");
    var speakersRef = firebase.database().ref().child("speakers").orderByChild("name");

    speakersRef.once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            var speaker = childSnapshot.val();
            speakers[speaker.id] = speaker;
        });
    });

    sessionsRef.once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            var session = childSnapshot.val();
            sessions[session.id] = session;
            addSessionInTable(session);
        });
    });

    // -- Helper methods ----------------------------------------------------------------------------------------------

    /**
     * Create table header based in available rooms
     *
     * @param rooms Available rooms
     */
    function createTableHeader(rooms) {
        var html = "<tr><th></th>";
        rooms.forEach(function (room) {
            html += "<th>" + room + "</th>";
        });

        $("table.day1 > thead").append(html);
        $("table.day2 > thead").append(html);
        $("table.day3 > thead").append(html);
    }

    /**
     * Add the session in the table cell
     *
     * @param session Session
     */
    function addSessionInTable(session) {

        if (session.type.toLowerCase() == "talk") {

            var timeslot = session.start.replace(/\s+/g, '-').replace(/:/g, '-');
            var hour = timeslot.split("-")[0];
            var minute = timeslot.split("-")[1];

            if (!$("tr." + timeslot).length) {
                var html = "<tr class='" + timeslot + "'>" +
                    "<td class='session-time'>" +
                    "<span class='session-hour'>" + hour + "</span>" +
                    "<span class='session-minute'>" + minute + "</span>" +
                    "</td>";

                rooms.forEach(function (room) {
                    html += "<td class='session hoverable'></td>"
                });
                html += "</tr>";
                $("table.day" + session.day + " > tbody:last-child").append(html);
            }

            var tdIndex = rooms.indexOf(session.room.toUpperCase()) + 2;
            var html = "<div class='session-title'>" + session.title + "</div>" +
                "<div class='hide-on-med-and-down session-track'><i class='tiny material-icons'>local_offer</i>" + session.track + "</div>";
            var td = $("table.day" + session.day + " tr." + timeslot).find("td:nth-child(" + tdIndex + ")");
            td.attr("id", session.id);
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

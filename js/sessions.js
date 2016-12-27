function DropDown(el) {
    this.dd = el;
    this.initEvents();
}

DropDown.prototype = {
    initEvents : function() {
        var obj = this;

        obj.dd.on('click', function(event){
            $(this).toggleClass('active');
            event.stopPropagation();
        });
    }
};

$(function () {
    initializeFirebase();
    sessions();

    var dd = new DropDown( $('.dropdown-wrapper') );
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
                openSessionModal(sessions[sessionId]);
            }
        })
        .on("change", ".track-filter", function (event) {
            event.stopImmediatePropagation();
            filterTracks($(this));
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

    /**
     * Retrieve all sesions from database
     */
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

    /**
     * Adds a session in the corresponding cell
     *
     * @param session Session
     */
    function addSessionInTable(session) {

        var html;
        var sessionType = session.type.toLowerCase();

        if (sessionType == "talk" || sessionType == "keynote") {

            var timeslot = session.start.replace(/:/g, '_');
            var hour = timeslot.split("_")[0];
            var minute = timeslot.split("_")[1];

            // If there is not timeslot for this time yet, create one
            if (!($("table.day" + session.day + " tr." + timeslot).length)) {
                html = "<tr class='timeslot " + timeslot + "'>" +
                    "<td class='session-time'>" +
                    "<span class='session-hour'>" + hour + "</span>" +
                    "<span class='session-minute'>" + minute + "</span>" +
                    "</td>";

                // Create a TD per room
                for (key in rooms) {
                    html += "<td class='" + rooms[key].name.toUpperCase() + "'></td>"
                }
                html += "</tr>";

                $("table.day" + session.day + " > tbody:last-child").append(html);
            }

            // New td content
            html = "<div id='" + session.id + "' class='session hoverable'>" +
                "<div class='session-title'>" + session.title + "</div>" +
                "<div class='hide-on-med-and-down session-track'>" +
                "<i class='tiny material-icons'>local_offer</i>" + session.track +
                "</div>" +
                "</div>";

            var td = $("table.day" + session.day + " tr." + timeslot + " td." + session.room.toUpperCase());
            if (!td.length) {
                console.log("Day: " + session.day + " & Start: " + session.start + " & Room: " + session.room + " & Track: " + session.track + " & Title: " + session.title);
            }
            td.html(html);

            var divSession = td.find("div.session");

            // Check if there is track in the session (database have sessions without track)
            if (session.track) {
                divSession.addClass(formatTrackId(session.track));
                // Check if there is a color for this track in the database
                if (tracks[session.track.toUpperCase()]) {
                    divSession.css("background-color", tracks[session.track.toUpperCase()].color);
                }

                // Add this track to the filter list if this is not there yet
                var trackId = formatTrackId(session.track);
                var trackList = $("#day" + session.day + "-track-filter ul");
                if (!(trackList.find("li." + trackId).length)) {
                    html = "<li class='day" + session.day + " " + trackId + "'>" +
                        "<a href='#' style='border-left-color: " + tracks[session.track.toUpperCase()].color + "'>" +
                        "<input type='checkbox' id='day" + session.day + "-" + trackId + "' name='" + trackId + "' " +
                        "class='track-filter' value='" + session.track + "'>" +
                        "<label for='day" + session.day + "-" + trackId + "'>" + session.track + "</label>" +
                        "</a></li>";
                    trackList.append(html)
                }
            }

        }

    }

    /**
     * Show session details
     *
     * @param session Session
     */
    function openSessionModal(session) {

        var modal = $("#session-detail");
        var content = modal.find(".modal-content");
        var footer = modal.find(".modal-footer");

        modal.css("background-color", tracks[session.track.toUpperCase()].color);

        var description = (session.description) ? session.description : "";

        content.find("h5").text(session.title);
        content.find(".session-description").html(description);
        content.find(".session-speakers").text(getSpeakers(session.speakers));
        content.find(".session-info .session-track").text(session.track);
        content.find(".session-info .session-room").text(session.room);

        (session.speakers) ? $(".session-speakers-icon").removeClass("hide") : $(".session-speakers-icon").addClass("hide");

        modal.modal('open');

    }

    /**
     * Filter session by track
     *
     * @param input Checkbox (track) clicked
     */
    function filterTracks(input) {
        var checkbox = $(input);
        var dayWrapper = $(input).parent().parent().parent().parent().parent();
        var allSessions = dayWrapper.find("div.session");
        var dropdownWrapper = dayWrapper.find(".dropdown-wrapper");
        var checkeds = dropdownWrapper.find(".track-filter:checkbox:checked");
        var filterWrapper = dayWrapper.find(".filter-wrapper");
        var filters = dayWrapper.find(".filters");

        // Hide all to display only filtered
        allSessions.addClass("hide");

        filterWrapper.removeClass("hide");

        var filtersText = "";
        for (i = 0; i < checkeds.length; i++) {
            if(i > 0){
                filtersText += ", "
            }
            filtersText += $(checkeds[i]).val();
            dayWrapper.find("div.session." + formatTrackId($(checkeds[i]).val())).removeClass("hide");
        }
        filters.text(filtersText);

        // if there is no track checked, display all again
        if (checkeds.length == 0) {
            filterWrapper.addClass("hide");
            allSessions.removeClass("hide");
        }
    }

    /**
     * Speaker formatter
     *
     * @param speakersId Speakers id
     * @returns {string} Speakers formatted
     */
    function getSpeakers(speakersId) {
        var s = "";

        if (speakersId) {
            for (i = 0; i < speakersId.length; i++) {
                var speaker = speakers[speakersId[i]];
                s += speaker.name;
                if (speakersId.length - 1 > i) {
                    s += " & ";
                }
            }
        }

        return s;
    }

    function formatTrackId(trackName) {
        return trackName.toUpperCase().replace(/\s+/g, '-').replace(/\./g, '');
    }

}

$(function () {
    sessions();
});

function sessions() {

    // Global variables -----------------------------------------------------------------------------------------------

    var rooms = {};
    var tracks = {};
    var speakers = [];
    var sessions = [];
    var votes = {};
    var favorites = [];

    var user = null;

    // Init -----------------------------------------------------------------------------------------------------------

    retrieveRooms();

    firebase.auth().onAuthStateChanged(function (currentUser) {
            if (currentUser) {
                user = currentUser;
                retrieveVotes();
                retrieveFavorites();
            } else {
                user = null;
                votes = {};
                favorites = [];
            }
        }, function (error) {
            console.log(error);
        }
    );

    // http://materializecss.com/modals.html#initialization
    $('.modal').modal();


    // -- Helper methods ----------------------------------------------------------------------------------------------

    /**
     * Retrieve all rooms from database
     */
    function retrieveRooms() {
        var roomsRef = firebase.database().ref().child("rooms").orderByChild("name");

        roomsRef.once('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                var room = childSnapshot.val();
                rooms[formatRoom(room.name)] = room;
            });

            createTableHeader();

            retrieveTracks();
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
                tracks[formatTrack(track.name)] = track;
            });

            retrieveSpeakers();
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

            retrieveSessions();
        });
    }

    /**
     * Retrieve all sesions from database
     */
    function retrieveSessions() {
        var sessionsRef = firebase.database().ref().child("sessions").orderByChild("start");

        sessionsRef.on("child_added", function (snapshot) {
            var session = snapshot.val();
            sessions[session.id] = session;

            addSessionInTable(session);
        });

        sessionsRef.on("child_changed", function (snapshot) {
            var session = snapshot.val();
            sessions[session.id] = session;

            $(session.id).remove();
            addSessionInTable(session);

            // If popup is opened, change the data there
            var modal = $("#session-detail");
            if (modal.find(".session-id").text() == session.id) {
                setSessionDetailOnModal(session);
            }
        });

        sessionsRef.on("child_removed", function (snapshot) {
            var session = sessions[snapshot.key];
            delete sessions[snapshot.key];

            $(session.id).remove();
        });

        displaySessions();

        if (window.location.hash) {
            var sessionId = window.location.hash.replace("#", "");
            if (sessions[sessionId]) {
                $(window.location.hash)[0].scrollIntoView();
                openSessionDetails(sessions[sessionId]);
            }
        }

    }


    function displaySessions() {
        $("#sessions").removeClass("hide");

        // Force select the first tab
        var sessionsTabs = $("#sessions").find("ul.tabs.tabs-fixed-width");
        var talks = sessionsTabs.find("li.tab:first a").attr('href').substring(1);
        sessionsTabs.tabs('select_tab', talks);

        var talksTabs = $("#talks").find("ul.tabs");
        var day1Talks = talksTabs.find("li.tab:first a").attr('href').substring(1);
        talksTabs.tabs('select_tab', day1Talks);

        // var workshopsTabs = $("#workshops").find("ul.tabs");
        // var day1Workshops = workshopsTabs.find("li.tab:first a").attr('href').substring(1);
        // workshopsTabs.tabs('select_tab', day1Workshops);

        $(".preloader-wrapper").addClass("hide");
    }

    /**
     * Room name formatter
     *
     * @param roomName
     * @returns {string}
     */
    function formatRoom(roomName) {
        return roomName.toUpperCase();
    }

    /**
     * Track name formatter
     *
     * @param trackName
     * @returns {string}
     */
    function formatTrack(trackName) {
        return trackName.toUpperCase().replace(/\s+/g, '-').replace(/,/g, '').replace(/\./g, '');
    }

    /**
     *
     * Formatter a timeslot replacing ":" by "_"
     *
     * Example: 10:00 will be change to 10_00
     *
     * @param session
     * @returns {string|XML|void}
     */
    function formatTimeSlot(session) {
        return session.start.replace(/:/g, '_');
    }

    /**
     * Create table header based in available rooms
     */
    function createTableHeader() {
        var talks = "<tr><th></th>";
        var workshops = "<tr><th></th>";

        for (var key in rooms) {
            if (roomType(rooms[key]) == "workshops") {
                workshops += "<th>" + rooms[key].name + "</th>";
            } else {
                talks += "<th>" + rooms[key].name + "</th>";
            }
        }

        $("#talks").find("table.day1 > thead").append(talks);
        $("#talks").find("table.day2 > thead").append(talks);
        $("#talks").find("table.day3 > thead").append(talks);
    }

    /**
     * Adds a session in the corresponding cell
     *
     * @param session Session
     */
    function addSessionInTable(session) {

        if (!existsTimeSlot(session)) {
            createTR(session);
        }

        // New td content
        var html = "<div id='" + session.id + "' class='session hoverable'>" +
            "<div class='session-title'>" + session.title + "</div>" +
            "<div class='hide-on-med-and-down session-track'>" +
	    "<div><i class='tiny material-icons'>person</i>" + getSpeakers(session.speakers,false) + "</div>" +
            "<div><i class='tiny material-icons'>local_offer</i>" + session.track + "</div>" +
            "<div><i class='tiny material-icons'>schedule</i>" + session.duration + "</div>" +
            "</div>" +
            "</div>";

        var td = findTd(session);
        // If for some reason this TD (room) does not exists for this day/hour
        if (!td.length) {
            log(session);
        } else {
            td.html(html);

            if (session.track) {

                var divSession = td.find("div.session");
                // Add the track has a class in the session to be filtered
                divSession.addClass(formatTrack(session.track));
                // Check if there is a color for this track in the database
                if (tracks[formatTrack(session.track)]) {
                    divSession.css("background-color", tracks[formatTrack(session.track)].color);
                }

                addTrackToFilterList(session);
            }

        }

    }

    /**
     *
     * Check if already have a tr to the corresponding day/hour
     *
     * @param session
     * @returns {jQuery}
     */
    function existsTimeSlot(session) {
        return $("#" + sessionType(session)).find("table.day" + session.day + " tr." + formatTimeSlot(session)).length;
    }

    /**
     * Create a TR in the table for the day/hour, add the time for this line and pre create the td for the rooms
     *
     * @param session
     */
    function createTR(session) {
        var html = "<tr class='timeslot " + formatTimeSlot(session) + "'>" +
            "<td class='session-time'>" +
            "<span class='session-hour'>" + session.start.split(":")[0] + "</span>" +
            "<span class='session-minute'>" + session.start.split(":")[1] + "</span>" +
            "</td>";

        // Create a TD per room
        for (key in rooms) {
            if (roomType(rooms[key]) == sessionType(session)) {
                html += "<td class='" + formatRoom(rooms[key].name) + "'></td>"
            }
        }
        html += "</tr>";
        $("#" + sessionType(session)).find("table.day" + session.day + " > tbody:last-child").append(html);
    }

    /**
     * Check if this is a workshop or talk session
     *
     * @param room The room
     * @returns {string} The type of the session "workshops" or "talks"
     */
    function roomType(room) {
        return "talks"; 
    }

    /**
     * Check if this is a workshop or talk session
     *
     * @param session The session
     * @returns {string} The type of the session "workshops" or "talks"
     */
    function sessionType(session) {
    	return "talks";
    }

    function findTd(session) {
        var type = sessionType(session);
        return $("#" + type)
            .find(
                "table.day" + session.day +
                " tr." + formatTimeSlot(session) +
                " td." + formatRoom(session.room)
            );
    }

    /**
     * Speaker formatter
     *
     * @param speakersId Speakers id
     * @returns {string} Speakers formatted
     */
    function getSpeakers(speakersId,link) {
        var s = "";

        if (speakersId) {
            for (i = 0; i < speakersId.length; i++) {
                var speaker = speakers[speakersId[i]];
		if(link == true){
	                s += "<a href='/speakers#" + speakers[speakersId[i]].id + "' class='speaker-link'>" + speaker.name + "</a>";
		}else{
			s += speaker.name;
			return s;
		}
                if (speakersId.length - 1 > i) {
                    s += " & ";
                }
            }
        }

        return s;
    }

    /**
     * Sort the <ul> list
     *
     * @param theList
     */
    function sortUnorderedList(theList) {
        var listitems = theList.children('li').get();

        listitems.sort(function (a, b) {
            return $(a).text().toUpperCase().localeCompare($(b).text().toUpperCase());
        });

        $.each(listitems, function (idx, itm) {
            theList.append(itm);
        });
    }

    /**
     * Log session on console
     *
     * @param session
     */
    function log(session) {
        console.log(
            "Day: " + session.day + " & " +
            "Start: " + session.start + " & " +
            "Room: " + session.room + " & " +
            "Type: " + session.type + " & " +
            "Track: " + session.track + " & " +
            "Title: " + session.title
        );
    }

}

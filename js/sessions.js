$(function () {
    sessions();
});

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
    // When click in a session show your details in a modal
        .on("click", ".session", function (event) {
            event.stopImmediatePropagation();
            var sessionId = $(this).attr("id");
            if (sessionId) {
                openSessionModal(sessions[sessionId]);
            }
        })
        // When click on filter dropdown, open/close it
        .on('click', ".dropdown-wrapper", function (event) {
            event.stopPropagation();
            $(this).toggleClass('active');
        })
        // When click in track on filter, add it to the filter
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
                rooms[formatRoom(room.name)] = room;
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
                tracks[formatTrack(track.name)] = track;
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

            displaySessions();
        });

    }

    function displaySessions() {
        $("#sessions").removeClass("hide");

        // Force select the first tab
        var firstTabName = $("ul.tabs li.tab:first a").attr('href').substring(1);
        $('ul.tabs').tabs('select_tab', firstTabName);

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
        return trackName.toUpperCase().replace(/\s+/g, '-').replace(/\./g, '');
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

        var sessionType = session.type.toLowerCase();

        if (sessionType == "talk" || sessionType == "keynote") {

            if (!existsTimeSlot(session)) {
                createTR(session);
            }

            // New td content
            var html = "<div id='" + session.id + "' class='session hoverable'>" +
                "<div class='session-title'>" + session.title + "</div>" +
                "<div class='hide-on-med-and-down session-track'>" +
                "<i class='tiny material-icons'>local_offer</i>" + session.track +
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

    }

    /**
     *
     * Check if already have a tr to the corresponding day/hour
     *
     * @param session
     * @returns {jQuery}
     */
    function existsTimeSlot(session) {
        return $("table.day" + session.day + " tr." + formatTimeSlot(session)).length;
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
            html += "<td class='" + formatRoom(rooms[key].name) + "'></td>"
        }
        html += "</tr>";

        $("table.day" + session.day + " > tbody:last-child").append(html);
    }

    function findTd(session) {
        return $("table.day" + session.day + " tr." + formatTimeSlot(session) + " td." + formatRoom(session.room));
    }

    /**
     * Add the session tracker to a tracker filter list if this is not there yet
     *
     * @param session
     */
    function addTrackToFilterList(session) {
        var trackId = formatTrack(session.track);
        var trackList = $("#day" + session.day + "-track-filter ul");
        if (!(trackList.find("li." + trackId).length)) {
            var html = "<li class='day" + session.day + " " + trackId + "'>" +
                "<a href='#' style='border-left-color: " + tracks[formatTrack(session.track)].color + "'>" +
                "<input type='checkbox' id='day" + session.day + "-" + trackId + "' name='" + trackId + "' " +
                "class='track-filter' value='" + session.track + "'>" +
                "<label for='day" + session.day + "-" + trackId + "'>" + session.track + "</label>" +
                "</a></li>";
            trackList.append(html)
        }

        sortUnorderedList(trackList);
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
     * Show session details
     *
     * @param session Session
     */
    function openSessionModal(session) {

        var modal = $("#session-detail");
        var content = modal.find(".modal-content");
        var footer = modal.find(".modal-footer");

        modal.css("background-color", tracks[formatTrack(session.track)].color);

        var description = (session.description) ? session.description : "";

        content.find("h5").text(session.title);
        content.find(".session-description").html(description);
        content.find(".session-speakers").html(getSpeakers(session.speakers));
        content.find(".session-info .session-track").text(session.track);
        content.find(".session-info .session-room").text(session.room);
        content.find(".session-info .session-duration").text(session.duration);
        content.find(".session-info .session-start").text("Day " + session.day + " at " + session.start);


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
            if (i > 0) {
                filtersText += ", "
            }
            filtersText += $(checkeds[i]).val();
            dayWrapper.find("div.session." + formatTrack($(checkeds[i]).val())).removeClass("hide");
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
                s += "<a href='/speakers#" + speakers[speakersId[i]].id + "'>" + speaker.name + "</a>";
                if (speakersId.length - 1 > i) {
                    s += " & ";
                }
            }
        }

        return s;
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
            "Track: " + session.track + " & " +
            "Title: " + session.title
        );
    }


}

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
    var csv = [];

    // Init -----------------------------------------------------------------------------------------------------------

    retrieveRooms();

    firebase.auth().onAuthStateChanged(function (currentUser) {
            if (currentUser) {
                user = currentUser;
                retrieveVotes();
            } else {
                user = null;
                votes = {};
            }
        }, function (error) {
            console.log(error);
        }
    );

    // http://materializecss.com/modals.html#initialization
    $('.modal').modal();

    // http://antenna.io/demo/jquery-bar-rating/examples/
    $('#vote-rating').barrating({
        theme: 'fontawesome-stars',
        showSelectedRating: false
    });

    // -- HTML Triggers -----------------------------------------------------------------------------------------------

    $("body")
    // When click in a session show your details in a modal
        .on("click", ".session", function (event) {
            event.preventDefault();
            var sessionId = $(this).attr("id");
            if (sessionId) {
                openSessionDetails(sessions[sessionId]);
            }
        })
        // When click speaker name on session details, open a modal with speaker details
        .on("click", ".speaker-link", function (event) {
            event.preventDefault();
            var speakerId = $(this).attr("href").split("#")[1];
            openSpeakerDetails(speakerId);
        })
        // When click in favorite on session page or detail
        .on("click", ".session-favorite-icon", function (event) {
            event.preventDefault();
            if (!user) {
                openSignIn();
            } else {
                favorite($("#session-detail").find(".session-id").text());
            }
        })
        // When click in sign in
        .on("click", "#google-sign-in", function (event) {
            event.preventDefault();
            $("#signin").modal('close');
            openGoogleSignInPopup();
        })
        // When click in the save button on feedback/vote popup
        .on("click", "#vote-send", function (event) {
            event.preventDefault();
            saveFeedback();
        })

	.on("click", "#csv", function (event) {
	    this.setAttribute('download','devconf.csv');
	    
	    var csvContent = "";
	    sessions.forEach( function (session){
		if(session.id in votes){
			addToCSV(session.speakers,session.title,votes[session.id]);
		}
	    });
  	    console.log(csv);
	    csv.forEach(function(infoArray){
		    console.log(infoArray);
		    csvContent += infoArray + "\n";
	    });
	    this.setAttribute('href', "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
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

    /**
     * Retrieve a list of sessions id what the user have vote
     */
    function retrieveVotes() {
        var favoritesRef = firebase.database().ref().child("votes");

        favoritesRef.once("value", function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                var favUser = childSnapshot.val();
		childSnapshot.forEach(function(voteSnapshot) {
			//console.log(voteSnapshot.key, voteSnapshot.val());
			if(voteSnapshot.key in votes){
				votes[voteSnapshot.key].push(voteSnapshot.val());
			}else{
				votes[voteSnapshot.key] = [voteSnapshot.val()];
			}	
		});
            });
        });
    }

    function displaySessions() {
        $("#sessions").removeClass("hide");


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
         return roomType(session);
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
     * Show session details
     *
     * @param session Session
     */
    function openSessionDetails(session) {

        var modal = $("#session-detail");

        if (tracks[formatTrack(session.track)]) {
            modal.css("background-color", tracks[formatTrack(session.track)].color);
        }

        setSessionDetailOnModal(session);

        modal.modal('open');

    }

    function setSessionDetailOnModal(session) {

        var modal = $("#session-detail");

        var description = (session.description) ? session.description : "";

        modal.find(".session-id").text(session.id);

        modal.find(".session-title").text(session.title);
        modal.find(".session-speakers").html(getSpeakers(session.speakers,false));
        modal.find(".session-info .session-track").text(session.track);
        modal.find(".session-info .session-difficulty").text(session.difficulty);
        modal.find(".session-info .session-start").text("Day " + session.day + " at " + session.start);
        modal.find(".session-info .session-room").text(session.room);
        modal.find(".session-info .session-duration").text(session.duration);
        modal.find(".session-description").html(description.replace(/\n/g, '<br />'));

        var speakerIcon = $(".session-speakers-icon");
        (session.speakers) ? speakerIcon.removeClass("hide") : speakerIcon.addClass("hide");

        // Vote/Feedback
        var vote = votes[session.id];
	modal.find(".feedback").html(getFormattedFeedback(vote));
        Materialize.updateTextFields();

    }

    /**
     * Formatted feedback
     *
     * @param feedback object
     * @return {string} formatted feedback
     */
    function getFormattedFeedback(feedback){
	var feedbackString = "";
	feedback.forEach( function(fb) {
		feedbackString += "No. stars: " + fb.rating + "/5<br>";
		if(fb.feedback.length > 0){
			feedbackString += "Feedback: " + fb.feedback + "<br>";
		}
		feedbackString += "<br>";
	});

	return feedbackString; 	
    }

    /**
      * Formatted feedback for CSV
      *
      * @param feedback object
      * @return {string} formatted feedback for CSV
      */
    function getCSVFeedback(feedback){
        var feedbackString = "";
	var reachedStars = 0;
	var totalStars = 0;
        feedback.forEach( function(fb) {
                reachedStars += parseInt(fb.rating);
		totalStars += 5;
                if(fb.feedback.length > 0){
                        feedbackString += fb.feedback.replace(/\n/g,"<br>") + "<br><br>";
                }
        });

        return reachedStars + "/" + totalStars + ";" + feedbackString;
    }


    /**
     * Add record to CSV output
     *
     * @param array of speakers
     * @param session title
     * @param feedback object
     * @return void
     */

    function addToCSV(spkrs, title, feedback){
	var fb = getCSVFeedback(feedback);
	spkrs.forEach( function (speaker){
		csv.push(getSpeakerEmail(speaker) + ";" + title.replace(/;/g," - ") + ";" + fb);	
	});
    }

    function getSpeakerEmail(speaker){
	return speakers[speaker].email;
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

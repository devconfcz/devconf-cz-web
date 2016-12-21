$(function () {
    initializeFirebase();
    speakers();
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

// -- Sessions --------------------------------------------------------------------------------------------------------

function sessions() {

    // -- HTML Triggers -----------------------------------------------------------------------------------------------

    // -- Firebase Database Triggers ----------------------------------------------------------------------------------

    var sessionsRef = firebase.database().ref().child("sessions").orderByChild("start");

    sessionsRef.on('child_added', function (snapshot) {
        addSession(snapshot.val());
    });

    // -- Helper methods ----------------------------------------------------------------------------------------------

    function addSession(session) {
        if(session.track.toLowerCase() != "workshop") {

        var sessionDay = session.day;
        var sessionHour = session.start.replace(/\s+/g, '-').replace(/:/g, '-');

        if (!existsScheduleDay(sessionDay)) {
            createScheduleDay(sessionDay);
        }

        if (!existsTimeslotInScheduleDay(sessionDay, sessionHour)) {
            createTimeslotFor(sessionDay, sessionHour);
        }

        var html = "<div id='" + session.id + "' class='session card hoverable " + session.track + "'>" +
            "<div class='card-content card-content--session'>" +
            "<span class='card-title card-title--session'>" + session.title + "</span>" +
            "<div class='session-info'>" +
            "<div class='session-room'><i class='tiny material-icons'>room</i>" + session.room + "</div>" +
            "<div class='session-track'><i class='tiny material-icons'>local_offer</i>" + session.track + "</div>" +
            "</div>" +
            "</div>" +
            "<div class='card-action card-action--session'>" +
            "<div class='session-speakers'>" +
            "<div class='session-speaker'><i class='tiny material-icons'>person</i>Daniel Passos</div>" +
            "<div class='session-speaker'><i class='tiny material-icons'>person</i>Karel Piwko</div>" +
            "</div>" +
            "</div>";

            findSessionWrapper(sessionDay, sessionHour).append(html);
        }
    }

    function findScheduleDay(day) {
        return $("div .schedule-day.day" + day);
    }

    function existsScheduleDay(day) {
        return findScheduleDay(day).length;
    }

    function createScheduleDay(sessionDay) {
        var html = "<div class='schedule-day day" + sessionDay + "'>";
        $(".container.session-container").append(html);
    }

    function findTimeSlot(day, timeslot) {
        return findScheduleDay(day).find(".timeslot." + timeslot);
    }

    function existsTimeslotInScheduleDay(day, timeslot) {
        return findTimeSlot(day, timeslot).length;
    }

    function createTimeslotFor(day, timeslot) {
        var hour = timeslot.split("-")[0];
        var minute = timeslot.split("-")[1];
        var meridiem = "AM";

        var html = "<div class='" + timeslot + " timeslot'>" +
            "<div class='session-time'>" +
            "<span class='session-hour'>" + hour + "</span>" +
            "<span class='session-minute'>" + minute + "</span>" +
            "</div>" +
            "<div class='sessions-wrapper'>" +
            "</div>" +
            "</div>";

        findScheduleDay(day).append(html);
    }

    function findSessionWrapper(day, hour) {
        return findTimeSlot(day, hour).find(".sessions-wrapper");
    }

}


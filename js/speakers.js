$(function () {
    initializeFirebase();
    speakers();
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

function speakers() {

    // -- Firebase Database Triggers ----------------------------------------------------------------------------------

    var speakersRef = firebase.database().ref().child("speakers");

    speakersRef.orderByChild("name").on('child_added', function (snapshot) {
        addNewSpeakerCard(snapshot.key, snapshot.val());
    });

    speakersRef.on('child_changed', function (snapshot) {
        updateSpeakerCard(snapshot.key, snapshot.val());
    });

    speakersRef.on('child_removed', function (snapshot) {
        removeSpeakerCard(snapshot.key, snapshot.val());
    });

    // -- HTML Triggers -----------------------------------------------------------------------------------------------

    $("body")
    // Show/Hide speaker bio when click on speaker photo
        .on("click", ".card-image.speaker-image", function (event) {
            event.stopImmediatePropagation();

            $(this).parent().find('.card-content.speaker-bio').slideToggle();
        })
        // Hide speaker bio when click on speaker bio
        .on("click", ".card-content.speaker-bio", function (event) {
            event.stopImmediatePropagation();

            $(this).slideToggle();
        });

    // -- Helper methods ----------------------------------------------------------------------------------------------

    /**
     * An id to be used in HTML to indentify the speaker
     *
     * @param id Database speakers id
     * @returns {string} Speakers Id
     */
    function createSpeakerId(id) {
        return "speaker-" + id;
    }

    /**
     * Add a new material design card with the speaker
     *
     * @param id Speaker ID
     * @param speaker speaker instance
     */
    function addNewSpeakerCard(id, speaker) {
        var html = "<div id='" + createSpeakerId(id) + "' class='card speaker hoverable'>" +
            "<div class='card-image speaker-image' style='background-image: url(\"" + speaker.avatar + "\")'>" +
            "<span class='card-title speaker-name'>" + speaker.name + "</span>" +
            "</div>" +
            "<div class='card-content speaker-bio'>" +
            speaker.bio +
            "</div>";

        $('.speakers-container').append(html);
    }

    /**
     * Update a spekaer card with the new informations changed in the database
     *
     * @param id Speaker id
     * @param speaker Speaker instance
     */
    function updateSpeakerCard(id, speaker) {
        var speakerCard = $("#" + createSpeakerId(id));
        var speakerAvatar = speakerCard.find(".speaker-image");
        var speakerName = speakerCard.find(".speaker-name");
        var speakerBio = speakerCard.find(".speaker-bio");

        speakerAvatar.css('background-image', 'url(' + speaker.avatar + ')');
        speakerName.text(speaker.name);
        speakerBio.text(speaker.bio);
    }

    function removeSpeakerCard(id, speaker) {
        var speakerCard = $("#" + createSpeakerId(id));

        speakerCard.fadeOut(500, function () {
            speakerCard.remove();
        });
    }

}

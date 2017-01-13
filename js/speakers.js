$(function () {
    speakers();
});

function speakers() {

    // Speakers local cache
    var speakers = [];

    // -- Firebase Database Triggers ----------------------------------------------------------------------------------

    var speakersRef = firebase.database().ref().child("speakers").orderByChild("name");

    speakersRef.once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            var speaker = childSnapshot.val();
            speakers[speaker.id] = speaker;
        });

        displaySpeakers();

        if (window.location.hash) {
            var speakerId = window.location.hash.replace("#", "");
            if (speakers[speakerId]) {
                $(window.location.hash)[0].scrollIntoView();
                showSpeakerDetails(speakerId);
            }
        }

    });

    // -- HTML Triggers -----------------------------------------------------------------------------------------------

    $("body")
    // Display speakers details
        .on("click", ".card-image.speaker-image", function (event) {
            event.stopImmediatePropagation();

            showSpeakerDetails($(this).parent().attr("id"));
        })
        // Hide speaker bio when click on speaker bio
        .on("click", ".card-content.speaker-bio", function (event) {
            event.stopImmediatePropagation();

            $(this).slideToggle();
        });

    // -- Helper methods ----------------------------------------------------------------------------------------------

    function displaySpeakers() {
        for (id in speakers) {
            addNewSpeakerCard(speakers[id]);
        }

        $(".preloader-wrapper").addClass("hide");
    }

    /**
     * Add a new material design card with the speaker
     *
     * @param id Speaker ID
     * @param speaker speaker instance
     */
    function addNewSpeakerCard(speaker) {

        var html = "<div id='" + speaker.id + "' class='card speaker hoverable'>" +
            "<div class='card-image speaker-image'>" +
            "<span class='card-title speaker-name'>" + speaker.name + "</span>" +
            "</div>";

        $('.speakers-container').append(html);

        // Load image from Firebase Storage
        var avatarRef = firebase.storage().ref().child("speakers/" + speaker.email  + ".png");
        avatarRef.getDownloadURL().then(function (url) {
            $("#" + speaker.id).find(".speaker-image").css('background-image', 'url(' + url + ')');
        });
    }

    function showSpeakerDetails(speakerId) {
        var speaker = speakers[speakerId];
        var modal = $('#speaker-detail');

        // Load image from Firebase Storage
        var avatarRef = firebase.storage().ref().child("speakers/" + speaker.email  + ".png");
        avatarRef.getDownloadURL().then(function (url) {
            modal.find(".speaker-image").attr("src", url);
        });

        modal.find(".speaker-name").text(speaker.name);
        modal.find(".speaker-country").text(speaker.country);
        modal.find(".speaker-organization").text(speaker.organization);
        modal.find(".speaker-bio").text(speaker.bio.replace(/\n/g, '<br />'));

        var twitterHTML = "";
        if (speaker.twitter) {
            twitterHTML = "<a href='http://twitter.com/" + speaker.twitter + "' target='_blank' class='twitter'>" +
                "@" + speaker.twitter + "" +
                "</a>";

        }
        modal.find(".speaker-twitter").html(twitterHTML);

        modal.modal('open');
    }

}

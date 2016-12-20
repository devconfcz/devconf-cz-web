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
        .on("click", ".speaker .card-image", function (event) {
            event.stopImmediatePropagation();

            $(this).parent().find('.card-content').slideToggle();
        })
        // Hide speaker bio when click on speaker bio
        .on("click", ".speaker .card-content", function (event) {
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
        var html = "<div class='speaker card hoverable " + id + "'>" +
            "<div class='card-image' style='background-image: url(\"" + speaker.avatar + "\")'>" +
            "<span class='card-title'>" + speaker.name + "</span>" +
            "</div>" +
            "<div class='card-content'>" +
            speaker.bio +
            "</div>";
        // Card Actions
        // html += "<div class='card-action'>";
        // if (speaker.twitter) {
        //     html += "<a href='http://twitter.com/" + speaker.twitter + "'>" +
        //         "<img src='assets/icons/twitter-icon.png' width='40px' height='40px' />" +
        //         "</a>";
        // }
        // html += "</div>";

        $('.speakers-container').append(html);
    }

}


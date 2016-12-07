$(function () {
    initializeFirebase();
    speaker();
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

// --

function speaker() {

    // -- HTML Triggers -----------------------------------------------------------------------------------------------


    // -- Firebase Database Triggers ----------------------------------------------------------------------------------

    var speakersRef = firebase.database().ref().child("speakers");

    speakersRef.orderByChild("name").on('child_added', function _add(snap, prevChild) {
        addNewSpeakerCard(snap.val());
    });

    // -- Helper methods ----------------------------------------------------------------------------------------------

    function addNewSpeakerCard(speaker) {
        var html = "<div class='speaker speakers-page card hoverable'>" +
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

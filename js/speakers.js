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

    function addNewSpeakerCard(data) {
        var html = "<div class='speaker speakers-page mdl-card mdl-shadow--2dp'>" +
            "<div class='mdl-card__title' style='background-image: url(\"" + data.avatar + "\")'>" +
            "<div class='mdl-card__title-text'>" +
            "<span class='name'>" + data.name + "</span>" +
            "</div>" +
            "</div>" +
            "<div class='mdl-card__supporting-text'>" + data.bio + "</div>" +
            "<div class='mdl-card__actions mdl-card--border'>";
        html += "<a href='http://twitter.com/" + data.twitter + "'><i class='zmdi zmdi-twitter zmdi-hc-2x'></i></a>";
        html += "</div>" +
            "</div>";

        $('.speakers-container').append(html);
    }

}

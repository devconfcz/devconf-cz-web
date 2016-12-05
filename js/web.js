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

    // -- Crud buttons trigger ----------------------------------------------------------------------------------------


    // -- Firebase Database Triggers ----------------------------------------------------------------------------------

    var gridContainer = $(".container");
    var count = 1;
    var speakersRef = firebase.database().ref().child("speakers");

    function addNewCard(data) {
        var html = "<div class='speaker-card mdl-card mdl-shadow--2dp mdl-cell mdl-cell--4-col'>" +
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

        $('.container div.mdl-grid:last').append(html);
    }

    speakersRef.orderByChild("name").on('child_added', function _add(snap, prevChild) {
        if (count == 1) {
            gridContainer.append("<div class='mdl-grid'>");
        }
        addNewCard(snap.val());
        if ((count > 1) && ((count % 3) == 0)) {
            console.log(count)
            gridContainer.append("</div>");
            gridContainer.append("<div class='mdl-grid'>");
        }
        count++;
    });


    // var speakers = getSynchronizedArray(speakersRef);
    // var speakers = getSynchronizedArray(speakersRef);

    // console.log(speakers);
    // console.log(speakers.length);
    //
    // speakers.forEach(function (speaker) {
    //     console.log(speaker.name);
    // });


    // /**
    //  * On new data was added in Firebase Database
    //  */
    // speakersRef.on("child_added", function (data) {
    //     var newData = {};
    //     var html
    //
    //     $("#content").append(html);
    //
    //     //speakers[data.key] = newData
    // });
    //
    // /**
    //  * On data was changed in Firebase Database
    //  */
    // speakersRef.on("child_changed", function (data) {
    //     // TODO
    // });
    //
    // /**
    //  * On data was removed in Firebase Database
    //  */
    // config.databaseRef.on("child_removed", function (data) {
    //     // TODO
    // });

    // -- Helper methods ----------------------------------------------------------------------------------------------

    // Based on Firebase post: https://firebase.googleblog.com/2014/05/handling-synchronized-arrays-with-real.html

    function getSynchronizedArray(firebaseRef) {
        var list = [];
        syncChanges(list, firebaseRef);
        return list;
    }

    function syncChanges(list, ref) {
        ref.on('child_added', function _add(snap, prevChild) {
            list[snap.key] = snap.val();
        });

        ref.on('child_removed', function _remove(snap) {
            delete list[snap.key];
        });

        ref.on('child_changed', function _change(snap) {
            list[snap.key] = snap.val();
        });
    }

}

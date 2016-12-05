$(function () {
    initializeFirebase();

    var speaker = configure({
        model: "speaker",
        fieldId: "key",
        fields: [
            new FieldOption(FieldType.IMAGE_URL, "avatar"),
            new FieldOption(FieldType.TEXT, "name"),
            new FieldOption(FieldType.TEXT, "email"),
            new FieldOption(FieldType.TEXT, "country"),
            new FieldOption(FieldType.TEXT, "twitter"),
            new FieldOption(FieldType.TEXTAREA, "bio")
        ],
        data: {},
        databaseRef: firebase.database().ref().child("speakers").orderByChild("name"),
        storageRef: firebase.storage().ref("speakers")
    });

    // Signout
    $("#signout").click(function (event) {
        event.preventDefault();
        firebase.auth().signOut().then(function () {
            console.log("Signed Out");
        }, function (error) {
            console.error("Sign Out Error", error);
        });
    });

});

var FieldType = {};
Object.defineProperty(FieldType, 'IMAGE', {value: "image"});
Object.defineProperty(FieldType, 'IMAGE_URL', {value: "image_url"});
Object.defineProperty(FieldType, 'TEXT', {value: "text"});
Object.defineProperty(FieldType, 'TEXTAREA', {value: "textarea"});

var FieldOption = function (type, name) {
    this.type = type;
    this.name = name;
};

function initializeFirebase() {
    var config = {
        apiKey: "AIzaSyBw1XF-Jbkz3DV8mANU_SQgYYq-wErVZfQ",
        authDomain: "devconf-cz-2017.firebaseapp.com",
        databaseURL: "https://devconf-cz-2017.firebaseio.com",
        storageBucket: "devconf-cz-2017.appspot.com",
        messagingSenderId: "88312300184"
    };

    firebase.initializeApp(config);

    firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                $("#user-photo").attr("src", user.photoURL);
                $("#user-name").text(user.displayName);
                $("#user-email").text(user.email);

                $("#content").show();
                $("#tabs").tabs();
                $("#firebaseui-auth-container").hide();
            } else {
                $("#firebaseui-auth-container").show();
                $("#content").hide();
                login();
            }
        }, function (error) {
            console.log(error);
        }
    );
}

function login() {
    var uiConfig = {
        "signInSuccessUrl": "admin.html",
        "signInOptions": [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        ]
    };

    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start("#firebaseui-auth-container", uiConfig);
}

function configure(config) {

    // Add a tab bar/content for this model
    $(".mdl-layout__tab-bar").append(createTabBar());
    $(".mdl-layout__content").append(createTabContent());


    // -- Crud buttons trigger ----------------------------------------------------------------------------------------


    $("body")
        .on("click", "#" + config.model + "-item-add", function (event) {
            event.preventDefault();
            openModalForm();
        })
        .on("click", "." + config.model + "-item-edit", function (event) {
            event.preventDefault();

            var itemId = $(this).closest("tr").find("." + config.fieldId).text();
            var itemSelected = config.data[itemId];

            // Add item id in the data to pass to edit form
            itemSelected[config.fieldId] = itemId;

            openModalForm(itemSelected);
        })
        .on("click", "." + config.model + "-item-remove", function (event) {
            event.preventDefault();

            var itemId = $(this).closest("tr").find("." + config.fieldId).text();
            remove(itemId);
            // TODO Dynamic field
        }).on("click", ".form-image-remove", function (event) {
            event.preventDefault();
            alert('Not implemented yet');
        });


    // -- Firebase Database Triggers ----------------------------------------------------------------------------------

    /**
     * On new data was added in Firebase Database
     */
    config.databaseRef.on("child_added", function (data) {
        var newData = {};
        var html = "<tr>";
        html += "<td class='" + config.fieldId + "' style='display: none;'>" + data.key + "</td>";

        $.each(config.fields, function (index, field) {
            newData[field.name] = data.val()[field.name];
            switch (field.type) {
                case FieldType.IMAGE:
                case FieldType.IMAGE_URL:
                    // TODO Review fixed width/height
                    var imageSrc = (newData[field.name]) ? newData[field.name] : "imgs/person-placeholder.jpg";
                    html += "<td class='" + field.name + "'><img src='" + imageSrc + "' class='img-circle' width='60px' height='60px' /></td>";
                    break;
                default:
                    // TODO Review fixed truncate class
                    html += "<td class='" + field.name + " mdl-data-table__cell--non-numeric truncate'>" + newData[field.name] + "</td>";
                    break;
            }

        });

        html += "<td class='edit'>" +
            "<button class='" + config.model + "-item-edit mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--colored'>" +
            "Edit" +
            "</button> &nbsp" +
            "<button class='" + config.model + "-item-remove mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent'>" +
            "Remove" +
            "</button>" +
            "</td>";

        html += "</tr>";

        $("#" + config.model + "-table > tbody:last-child").append(html);

        config.data[data.key] = newData
    });

    /**
     * On data was changed in Firebase Database
     */
    config.databaseRef.on("child_changed", function (data) {

        var newValues = {};
        var tableRow = $("td." + config.fieldId).filter(function () {
            return $(this).text() == data.key;
        }).closest("tr");

        $.each(config.fields, function (index, field) {
            // Update data model
            newValues[field.name] = data.val()[field.name];
            // Update the UI
            switch (field.type) {
                case FieldType.IMAGE:
                    // Prevent update imagem until image was not completed uploaded
                    var imageSrc = data.val()[field.name];
                    if ((imageSrc) && (!imageSrc.includes("fakepath"))) {
                        tableRow.find('td.' + field.name + " img").attr("src", imageSrc);
                    }
                    break;
                default:
                    tableRow.find('td.' + field.name).text(data.val()[field.name]);
                    break;
            }

        });

        config.data[data.key] = newValues;
    });

    /**
     * On data was removed in Firebase Database
     */
    config.databaseRef.on("child_removed", function (data) {
        delete config.data[data.key];
        var tableRow = $("td." + config.fieldId).filter(function () {
            return $(this).text() == data.key;
        }).closest("tr");
        tableRow.css("background-color", "#FF3700");
        tableRow.fadeOut(400, function () {
            tableRow.remove();
        });
    });

    // -- Helper methods ----------------------------------------------------------------------------------------------

    /**
     * Mount a tab html with the data model name
     *
     * @returns {string} Tab bar HTML
     */
    function createTabBar() {
        return "<a href='#scroll-tab-" + config.model + "' class='mdl-layout__tab'>" + config.model + "</a>";
    }

    /**
     * Mount a form html to be used in a tab
     *
     * @returns {string} Tab content HTML
     */
    function createTabContent() {
        var html_tab_content = "<section class='mdl-layout__tab-panel' id='scroll-tab-" + config.model + "'>" +
            "<div class='page-content'>" +
            "<button id='" + config.model + "-item-add' class='mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored'>" +
            "<i class='material-icons'>add</i>" +
            "</button>" +
            "<div id='" + config.model + "' class='page-content'>" +
            "<table id='" + config.model + "-table' class='mdl-data-table mdl-js-data-table mdl-shadow--2dp'>" +
            "<thead>" +
            "<tr>" +
            "<th class='sort' data-sort='" + config.fieldId + "' style='display: none'>ID</th>";

        config.fields.forEach(function (field) {
            html_tab_content += "<th class='sort mdl-data-table__cell--non-numeric' data-sort='" + field.name + "'>" + field.name + "</th>";
        });

        html_tab_content += "<th>-</th>" +
            "</tr>" +
            "</thead>" +
            "<tbody>" +
            "</tbody>" +
            "</table>" +
            "</div>" +
            "</div>" +
            "</section>";

        return html_tab_content;
    }

    /**
     * Get field value from data
     *
     * @param fieldName Name of the data model field
     * @param data Model data
     * @returns {string} Value of the data model field of blank ("")
     */
    function getValue(fieldName, data) {
        return (!data) ? "" : data[fieldName];
    }

    /**
     * Mount a form html to be used in a "modal" based in the config fields array
     *
     * @param data Model data
     * @returns {string} HTML form
     */
    function createFormHtml(data) {

        var html_form = "<form><fieldset>" +
            "<input type='hidden' id='" + config.model + "-" + config.fieldId + "' " +
            "value='" + getValue(config.fieldId, data) + "'/>";

        config.fields.forEach(function (field) {
            switch (field.type) {
                case FieldType.IMAGE:
                    // Add a thumb image
                    if (getValue(field, data) != "") {
                        html_form += "<img class='form-image' src='" + getValue(field.name, data) + "' " +
                            "width='60dp' height='60px' />";                            
                    }
                    html_form += "<span class='form-file'>" +
                        "<label for='" + config.model + "-" + field.name + "'>" + field.name + ":</label>" +
                        "<input type='file' id='" + config.model + "-" + field.name + "' " +
                        "placeholder='" + field.name + "' class='text ui-widget-content ui-corner-all'/>" +
                        "</span>";
                    // Add an option to remove the thumb image
                    if (getValue(field, data) != "") {
                        html_form += "<a href='" + getValue(config.fieldId, data) + "' class='form-image-remove'>Remove</a>"
                    }                        
                    break;
                case FieldType.TEXTAREA:
                    html_form += "<label for='" + config.model + "-" + field.name + "'>" + field.name + ":</label>" +
                        "<textarea id='" + config.model + "-" + field.name + "' " +
                        "placeholder='" + field.name + "' rows='5'>" + getValue(field.name, data) + "</textarea>";
                    break;
                default:
                    html_form += "<label for='" + config.model + "-" + field.name + "'>" + field.name + ":</label>" +
                        "<input type='text' id='" + config.model + "-" + field.name + "' " +
                        "value='" + getValue(field.name, data) + "' " +
                        "placeholder='" + field.name + "' class='text ui-widget-content ui-corner-all'/>";
                    break;
            }
        });
        html_form += "</fieldset></form>";

        return html_form;
    }

    /**
     * Open a model window with the dinamic form created with createFormHtml
     * @param data model data
     */
    function openModalForm(data) {
        $("<div id='" + config.model + "-form' title='" + config.model + "'></div>").dialog({
            width: 900,
            height: 700,
            modal: true,
            title: config.model,
            open: function () {
                $(this).html(createFormHtml(data));
            },
            buttons: {
                "Save": function () {
                    saveData($(this).parent());
                    $(this).dialog("close");
                },
                "Cancel": function () {
                    $(this).dialog("close");
                }
            }
        });
    }

    /**
     * Create a JSON model data from the form
     *
     * @returns Model data in JSON format
     */
    function JsonDataFromForm(form) {
        var data = {};

        // Add item id in the data to pass to save method
        data[config.fieldId] = $(form).find("#" + config.model + "-" + config.fieldId).val();

        $.each(config.fields, function (index, field) {
            if (field.type != FieldType.IMAGE) {
                data[field.name] = $(form).find("#" + config.model + "-" + field.name).val();
            }
        });

        return data;
    }

    /**
     * Save a new model data in Firebase database
     */
    function saveData(form) {

        var data = JsonDataFromForm(form);

        var key = (!data[config.fieldId]) ? config.databaseRef.push().key : data[config.fieldId];

        // Remove key to not be saved with model data
        delete data[config.fieldId];

        // Update all image fields to Firebase storage
        config.fields.forEach(function (field) {
            if (field.type == FieldType.IMAGE) {
                var fileButton = $(form).find("#" + config.model + "-" + field.name);

                if (fileButton.val() != "") {
                    var file = fileButton[0].files[0];
                    // key/model-fielname.file_exetension
                    var fileName = key + "/" + config.model + "-" + field.name + "." + file.name.split('.').pop();

                    uploadImage(file, fileName, function (fileUrl) {
                        data[field.name] = fileUrl;
                        config.databaseRef.child(key).set(data);
                    });
                } else {
                    // Retrieve previous uploaded file URL (if exists)
                    data[field.name] = (config.data[key]) ? config.data[key][field.name] : "";
                }
            }
        });

        config.databaseRef.child(key).set(data);

    }

    /**
     * Remove data and files associated
     *
     * @param id Id of the data/file folder
     */
    function remove(id) {
        config.databaseRef.child(id).remove();
        /**
         * There is not way to delete a folder from Firebase API
         * See: https://groups.google.com/forum/#!topic/firebase-talk/aG7GSR7kVtw
         */
        //config.storageRef.child(id).delete();
    }

    /**
     * Upload file (image) to the Firebase Storage
     *
     * @param file Local file path
     * @param fileName Remove file path + name
     */
    function uploadImage(file, fileName, callback) {
        if (file) {
            var uploadTask = config.storageRef.child(fileName).put(file);
            uploadTask.on('state_changed', function (snapshot) {
            }, function (error) {
                // TODO Display error!
            }, function () {
                callback(uploadTask.snapshot.downloadURL);
            });
        }

    }

}

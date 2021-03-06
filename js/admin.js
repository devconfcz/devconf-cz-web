$(function () {
    signInListener();

    var track = configure({
        model: "track",
        fieldId: "key",
        fields: [
            new FieldOption(FieldType.TEXT, "name"),
            new FieldOption(FieldType.HEX, "color")
        ],
        data: {},
        databaseRef: firebase.database().ref().child("tracks"),
        databaseOrder: "name"
    });

    var room = configure({
        model: "room",
        fieldId: "key",
        fields: [
            new FieldOption(FieldType.TEXT, "name"),
            new FieldOption(FieldType.TEXT, "type")
        ],
        data: {},
        databaseRef: firebase.database().ref().child("rooms"),
        databaseOrder: "name"
    });

    var speaker = configure({
        model: "speaker",
        fieldId: "key",
        fields: [
            new FieldOption(FieldType.IMAGE_URL, "avatar", {size: 50}),
            new FieldOption(FieldType.TEXT, "name"),
            new FieldOption(FieldType.TEXT, "email"),
            new FieldOption(FieldType.TEXT, "country"),
            new FieldOption(FieldType.TEXT, "organization"),
            new FieldOption(FieldType.TEXT, "twitter"),
            new FieldOption(FieldType.TEXTAREA, "bio", {rows: 10, truncate: 70})
        ],
        data: {},
        databaseRef: firebase.database().ref().child("speakers"),
        databaseOrder: "name",
        storageRef: firebase.storage().ref("speakers")
    });

    var session = configure({
        model: "session",
        fieldId: "key",
        fields: [
            new FieldOption(FieldType.TEXT, "title"),
            new FieldOption(FieldType.TEXT, "type"),
            new FieldOption(FieldType.TEXT, "track"),
            new FieldOption(FieldType.TEXT, "difficulty"),
            new FieldOption(FieldType.TEXT, "room"),
            new FieldOption(FieldType.TEXT, "day"),
            new FieldOption(FieldType.TEXT, "start"),
            new FieldOption(FieldType.TEXT, "duration"),
            new FieldOption(FieldType.TEXTAREA, "description", {rows: 10, truncate: 40})
        ],
        data: {},
        databaseRef: firebase.database().ref().child("sessions"),
        databaseOrder: "day",
        storageRef: firebase.storage().ref("sessions")
    });

    // Force select the first tab
    var firstTabName = $("ul.tabs li.tab:first a").attr('href').substring(1);
    $('ul.tabs').tabs('select_tab', firstTabName);
});

String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

var FieldType = {};
Object.defineProperty(FieldType, 'IMAGE', {value: "image"});
Object.defineProperty(FieldType, 'IMAGE_URL', {value: "image_url"});
Object.defineProperty(FieldType, 'TEXT', {value: "text"});
Object.defineProperty(FieldType, 'TEXTAREA', {value: "textarea"});
Object.defineProperty(FieldType, 'HEX', {value: "hex"});

var FieldOption = function (type, name, options) {
    this.type = type;
    this.name = name;
    this.options = options;
};

function signInListener() {
    firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                $(".user-photo").attr("src", user.photoURL);
                $(".user-name").text(user.displayName);
                $(".user-email").text(user.email);

                $('ul.tabs').tabs();
                $(".button-collapse").sideNav();
                $('.modal').modal();

                $("#firebaseui-auth-container").hide();

                checkPermission();
            } else {
                $("#firebaseui-auth-container").show();
                $("#container").addClass("hide");

                login();
            }
        }, function (error) {
            console.log(error);
        }
    );

    // Signout
    $("#signout").click(function (event) {
        event.preventDefault();
        firebase.auth().signOut().then(function () {

        }, function (error) {
            console.error("Sign Out Error", error);
        });
    });
}

function checkPermission() {
    var checkAccessRef = firebase.database().ref().child("checkAccess");

    checkAccessRef.once('value', function (snapshot) {
        $("#container").removeClass("hide");
    }, function (error) {
        var html = "<div id='modal-permission' class='modal'>" +
            "<div class='modal-content'>" +
            "<h4>Permission Denied</h4>" +
            "<p>Sorry you don't have premission to access this page</p>" +
            "</div>" +
            "<div class='modal-footer'>" +
            "<a href='#!' class=' modal-action modal-close waves-effect waves-green btn-flat'>Ok!</a>" +
            "</div>" +
            "</div>";
        $("#container").html(html);
        $("#container").removeClass("hide");
        $('.modal').modal();
        $('#modal-permission').modal('open');
    });
}

function login() {
    var uiConfig = {
        "signInSuccessUrl": "admin.html",
        "signInOptions": [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID
        ]
    };

    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start("#firebaseui-auth-container", uiConfig);
}

function configure(config) {

    // Add a new tab bar and a table to display data model list
    $("ul.tabs").append(createTab());
    $("#container").append(createDataModelTable());

    // Create a modal and a form to create/update a data model
    $("#container").append(createModalForm());

    // -- Buttons trigger ----------------------------------------------------------------------------------------

    $("body")
        .on("click", "#" + createIdName("item-add"), function (event) {
            event.preventDefault();
            openModalForm();
        })
        .on("click", "." + createIdName("item-edit"), function (event) {
            event.preventDefault();

            var key = $(this).closest("tr").find("." + config.fieldId).text();
            var itemSelected = config.data[key];

            // Add item id in the data to pass to edit form
            itemSelected[config.fieldId] = key;

            openModalForm(key, itemSelected);
        })
        .on("click", "." + createIdName("item-remove"), function (event) {
            event.preventDefault();

            var key = $(this).closest("tr").find("." + config.fieldId).text();

            removeData(key);
        })
        .on("click", "#" + createIdName('item-save'), function (event) {
            event.preventDefault();
            saveData($("#" + createIdName("form")));
            $("#" + createIdName("modal-form")).modal('close');
        });

    // -- Firebase Database Triggers ----------------------------------------------------------------------------------

    /**
     * On new data was added in Firebase Database
     */
    config.databaseRef.orderByChild(config.databaseOrder).on("child_added", function (snapshot) {
        var dataModel = parseDataModelFromFirebaseSnapshot(snapshot);

        // Add new data to a local cache
        config.data[snapshot.key] = dataModel;

        addNewTableRow(snapshot.key, dataModel);
    });

    /**
     * On data was changed in Firebase Database
     */
    config.databaseRef.on("child_changed", function (snapshot) {

        var dataModel = parseDataModelFromFirebaseSnapshot(snapshot);

        // Update data in the local cache
        config.data[snapshot.key] = dataModel;

        updataTableRow(snapshot.key, dataModel);
    });

    /**
     * On data was removed in Firebase Database
     */
    config.databaseRef.on("child_removed", function (snapshot) {

        // Remove data from the local cache
        delete config.data[snapshot.key];

        removeTableRow(snapshot.key);
    });

    // -- Helper methods ----------------------------------------------------------------------------------------------

    /**
     * Centralize a way to create
     *
     * @param to Something to identify for where it will be used
     * @returns {*} Formatted name to use in HTML id or class
     */
    // TOOD Rename
    function createIdName(to) {
        return (to) ? config.model + "-" + to : config.model;
    }

    /**
     * Parse data model from Firebase snapshot
     *
     * @returns Data model
     */
    function parseDataModelFromFirebaseSnapshot(snapshot) {
        var data = {};

        $.each(config.fields, function (index, field) {
            data[field.name] = snapshot.val()[field.name];
        });

        return data;
    }

    /**
     * Parse data model from form
     *
     * @returns Data model
     */
    function parseDataModelFromForm(form) {
        var data = {};

        // Add item id in the data to pass to save method
        data[config.fieldId] = $(form).find("#" + createIdName(config.fieldId)).val();

        $.each(config.fields, function (index, field) {
            if (field.type != FieldType.IMAGE) {
                data[field.name] = $(form).find("#" + createIdName(field.name)).val();
            }
        });

        return data;
    }

    /**
     * Create a html tab html for the data model
     *
     * @returns {string} Tab bar HTML
     */
    function createTab() {
        return "<li class='tab'><a href='#" + createIdName("tab") + "'>" + config.model + "</li>";
    }

    /**
     * Create a table to display a list of data model in the tab
     *
     * @returns {string} Tab content HTML
     */
    function createDataModelTable() {
        var html = "<div id='" + createIdName("tab") + "'>" +
            "<div id='" + createIdName() + "' class='page-content'>" +
            "<table id='" + createIdName("table") + "' class='model-table bordered highlight responsive-table'>" +
            "<thead>" +
            "<tr>" +
            "<th style='display: none'>ID</th>";

        config.fields.forEach(function (field) {
            html += "<th data-field='" + field.name + "'>" + field.name + "</th>";
        });

        html += "<th class='controls'></th>" +
            "</tr>" +
            "</thead>" +
            "<tbody>" +
            "</tbody>" +
            "</table>" +
//            "<a href='#' id='" + createIdName("item-add") + "' class='btn-floating btn-large waves-effect waves-light red'><i class='material-icons'>add</i></a>" +
            "</div>" +
            "</div>";

        return html;
    }

    /**
     * Add a new row in the data model table
     *
     * @param key of the row/data
     * @param data Data model instance
     */
    function addNewTableRow(key, data) {
        var html = "<tr>";
        html += "<td class='" + config.fieldId + "' style='display: none;'>" + key + "</td>";

        $.each(config.fields, function (index, field) {
            switch (field.type) {
                case FieldType.IMAGE:
                case FieldType.IMAGE_URL:
                    var imageSrc = (data[field.name]) ? data[field.name] : "assets/imgs/person-placeholder.jpg";
                    html += "<td class='" + field.name + "'>" +
                        "<img src='" + imageSrc + "' class='circle' width='" + field.options.size + "px' height='" + field.options.size + "px' />" +
                        "</td>";
                    break;
                default:
                    var value = "";
                    if (data[field.name]) {
                        if (field.options && field.options.truncate && data[field.name].length > field.options.truncate) {
                            value = data[field.name].substring(0, field.options.truncate) + "...";
                        } else {
                            value = data[field.name];
                        }
                    }
                    html += "<td class='" + field.name + " mdl-data-table__cell--non-numeric'>" + value + "</td>";
                    break;
            }

        });

        html += "<td class='edit'>" +
            "&nbsp;" +
            "<a href='#' class='" + createIdName("item-edit") + "'>" +
            "<i class='material-icons'>edit</i>" +
            "</a> &nbsp; &nbsp;" +
            "<a href='#' class='" + createIdName("item-remove") + "'>" +
            "<i class='material-icons'>delete</i>" +
            "</a>" +
            "&nbsp;" +
            "</td>";

        html += "</tr>";

        $("#" + createIdName("table") + " > tbody:last-child").append(html);
    }

    /**
     * Update model value in the data model table
     *
     * @param key of the row/data
     * @param data Data model instance
     */
    function updataTableRow(key, data) {
        var tableRow = $("td." + config.fieldId).filter(function () {
            return $(this).text() == key;
        }).closest("tr");

        $.each(config.fields, function (index, field) {
            switch (field.type) {
                case FieldType.IMAGE:
                case FieldType.IMAGE_URL:
                    // Prevent update imagem until image was not completed uploaded
                    var imageSrc = data[field.name];
                    if ((imageSrc) && (!imageSrc.includes("fakepath"))) {
                        tableRow.find('td.' + field.name + " img").attr("src", imageSrc);
                    }
                    break;
                default:
                    var value = (field.options && field.options.truncate) ?
                    data[field.name].substring(0, field.options.truncate) + "..." : data[field.name];

                    tableRow.find('td.' + field.name).text(value);
                    break;
            }

        });
    }

    /**
     *
     * Remove a row in the data model table
     *
     * @param key of the row/data
     */
    function removeTableRow(key) {
        var tableRow = $("td." + config.fieldId).filter(function () {
            return $(this).text() == key;
        }).closest("tr");

        // TODO Move to CSS
        tableRow.css("background-color", "#FF3700");
        tableRow.fadeOut(400, function () {
            tableRow.remove();
        });
    }

    /**
     * Create a form in a modal to create/update data model
     *
     * @returns {string} HTML modal form
     */
    function createModalForm() {
        var html = "<div id='" + createIdName("modal-form") + "' class='modal modal-fixed-footer'>" +
            "<div class='modal-content'>" +
            "<h4>" + config.model.capitalizeFirstLetter() + "</h4><form id='" + createIdName("form") + "'><fieldset>" +
            "<input type='hidden' id='" + createIdName(config.fieldId) + "'/>";

        config.fields.forEach(function (field) {
            switch (field.type) {
                case FieldType.IMAGE:
                    // Add a thumb image
                    // TODO
                    // if (getValue(field, data) != "") {
                    //     html += "<img class='form-image' src='" + getValue(field.name, data) + "' " +
                    //         "width='" + field.options.size + "px' height='" + field.options.size + "px' />";
                    // }
                    html += "<span class='form-file'>" +
                        "<label for='" + createIdName(field.name) + "'>" + field.name + ":</label>" +
                        "<input type='file' id='" + createIdName(field.name) + "' " +
                        "placeholder='" + field.name + "' class='text ui-widget-content ui-corner-all'/>" +
                        "</span>";
                    break;
                case FieldType.TEXTAREA:
                    html += "<div class='input-field'>" +
                        "<label for='" + createIdName(field.name) + "'>" + field.name + ":</label>" +
                        "<textarea id='" + createIdName(field.name) + "' " +
                        "class='materialize-textarea' rows='" + field.options.rows + "'></textarea>" +
                        "</div>";
                    break;
                default:
                    html += "<div class='input-field'>" +
                        "<label for='" + createIdName(field.name) + "'>" + field.name + ":</label>" +
                        "<input type='text' id='" + createIdName(field.name) + "' />" +
                        "</div>";
                    break;
            }
        });
        html += "</fieldset>" +
            "</form>" +
            "</div>" +
            "<div class='modal-footer'>" +
            "<a href='#!' class='modal-action modal-close waves-effect waves-green btn-flat'>Cancel</a>" +
            "<a href='#!' id='" + createIdName('item-save') + "' class='modal-action waves-effect waves-green btn-flat'>Save</a>" +
            "</div>" +
            "</div>";

        return html;
    }


    /**
     * Open a model window with the dinamic form created with createFormHtml
     *
     * @param data model data
     */
    function openModalForm(key, data) {
        // Put key temporarily in the data to use in the form
        $("#" + createIdName("form")).find("#" + createIdName(config.fieldId)).val(key);

        config.fields.forEach(function (field) {
            var formField = $("#" + createIdName("form")).find("#" + createIdName(field.name));
            var value = (data && data[field.name]) ? data[field.name] : "";
            formField.val(value);
            if (field.type == FieldType.TEXTAREA) {
                formField.trigger('autoresize');
            }
        });

        Materialize.updateTextFields();

        $("#" + createIdName('modal-form')).modal({
            ready: function (modal, trigger) {
                $('#' + createIdName("form") + ' :input:enabled:visible:first').focus();
            }
        });

        $("#" + createIdName('modal-form')).modal('open');
    }

    /**
     * Save a new model data in Firebase database
     */
    function saveData(form) {

        var data = parseDataModelFromForm(form);

        var key = (!data[config.fieldId]) ? config.databaseRef.push().key : data[config.fieldId];

        // Remove key to not be saved with model data
        delete data[config.fieldId];

        // Update all image fields to Firebase storage
        config.fields.forEach(function (field) {
            if (field.type == FieldType.IMAGE) {
                var fileButton = $(form).find("#" + createIdName(field.name));

                if (fileButton.val() != "") {
                    var file = fileButton[0].files[0];
                    // key/model-fieldname.file_exetension
                    var absolutePath = key + "/" + createIdName(field.name) + "." + file.name.split('.').pop();

                    uploadImage(file, absolutePath, function (fileUrl) {
                        data[field.name] = fileUrl;
                        config.databaseRef.child(key).set(data);
                    });
                } else {
                    // Retrieve previous uploaded file URL (if exists)
                    data[field.name] = (config.data[key]) ? config.data[key][field.name] : "";
                }
            }
        });

        config.databaseRef.child(key).update(data, function (error) {
            if (error) {
                alert("Data could not be saved." + error);
            }
        });

    }

    /**
     * Remove data and files associated
     *
     * @param id Id of the data/file folder
     */
    function removeData(id) {
        config.databaseRef.child(id).remove(function (error) {
            if (error) {
                alert("Data could not be removed." + error);
            }
        });
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
     * @param absolutePath absolute file path (folder + file name)
     * @param callback Callback function called when successfully uploaded
     */
    function uploadImage(file, absolutePath, callback) {
        if (file) {
            var uploadTask = config.storageRef.child(absolutePath).put(file);
            uploadTask.on('state_changed', function (snapshot) {
            }, function (error) {
                // TODO Display error!
            }, function () {
                callback(uploadTask.snapshot.downloadURL);
            });
        }
    }

}

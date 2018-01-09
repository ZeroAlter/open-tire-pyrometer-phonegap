// Initialize app
var myApp = new Framework7();


// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

// Handle Cordova Device Ready Event
// $$(document).on('deviceready', function() {
//     console.log("Device is ready!");
// });


// Now we need to run the code that will be executed only for About page.

// Option 1. Using page callback for page (for "about" page in this case) (recommended way):
myApp.onPageInit('about', function (page) {
    // Do something here for "about" page
    myApp.alert('Here comes About page');

})

// // Option 2. Using one 'pageInit' event handler for all pages:
// $$(document).on('pageInit', function (e) {
//     // Get page data from event data
//     var page = e.detail.page;
//
//     if (page.name === 'about') {
//         // Following code will be executed for page with data-page attribute equal to "about"
//         myApp.alert('Here comes About page');
//     }
// })
//
// // Option 2. Using live 'pageInit' event handlers for each page
// $$(document).on('pageInit', '.page[data-page="about"]', function (e) {
//     // Following code will be executed for page with data-page attribute equal to "about"
//     myApp.alert('Here comes About page');
// })

// USER CODE **********************
var PYROMETER_SERVICE = '142b8c89-28d2-4196-a978-6fcc64823422';
var PYROMETER_MEASUREMENT_CHARACTERISTIC = '9fe5ea27-1273-47f2-b0a6-abd53bfd3ac6';

var toFahrenheit = function(celsius) {
    return (celsius * 1.8 + 32.0);
};

var app = {
    initialize: function() {
        this.bindEvents();
        this.showMainPage();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('backbutton', this.onBackButton, false);
        deviceList.addEventListener('click', this.connect, false);
        refreshButton.addEventListener('click', this.refreshDeviceList, false);
        disconnectButton.addEventListener('click', this.disconnect, false);
    },
    onDeviceReady: function() {
        FastClick.attach(document.body); // https://github.com/ftlabs/fastclick
        debugDiv.innerHTML = "Scanning for BLE Devices";
        app.refreshDeviceList();
    },
    refreshDeviceList: function() {
        deviceList.innerHTML = ''; // empty the list
        debugDiv.innerHTML = "Scanning for BLE Devices - Refresh";
        ble.scan([], 5, app.onDiscoverDevice, app.onError);
    },
    onDiscoverDevice: function(device) {
        var listItem = document.createElement('li');
        listItem.innerHTML = device.name + '<br/>' +
            device.id + '<br/>' +
            'RSSI: ' + device.rssi;
        listItem.dataset.deviceId = device.id;
        deviceList.appendChild(listItem);
    },
    connect: function(e) {
        var deviceId = e.target.dataset.deviceId;
        debugDiv.innerHTML = deviceId;
        ble.connect(deviceId, app.onConnect, app.onError);
    },
    onConnect: function(peripheral) {
        debugDiv.innerHTML = peripheral.id;
        app.peripheral = peripheral;

        // subscribe to be notified when the pyrometer state changes
        ble.startNotification(
            peripheral.id,
            PYROMETER_SERVICE,
            PYROMETER_MEASUREMENT_CHARACTERISTIC,
            app.onTemperatureChange,
            app.onError
        );
        // show the measurement display
        app.showDetailPage();
    },
    onTemperatureChange: function(buffer) {
        // expecting 1 unsigned 16 bit value and 1 signed 16 bit value
        // for now just parse them into signed Int
        var data = new Int16Array(buffer);
        debugDiv.innerHTML = data; // display the raw data for debugging

        var pyroStatus = data[0];

        var unit = 'C';
        var measuredTempC = data[1] / 10;

        var message = 'Pyrometer: ' + measuredTempC.toFixed(1) + ' &deg;' + unit + '<br/>';

        statusDiv.innerHTML = message;

    },
    disconnect: function(e) {
        if (app.peripheral && app.peripheral.id) {
            ble.disconnect(app.peripheral.id, app.showMainPage, app.onError);
        }
    },
    showMainPage: function() {
        mainPage.hidden = false;
        detailPage.hidden = true;
        console.log("Showing Main Page");
    },
    showDetailPage: function() {
        mainPage.hidden = true;
        detailPage.hidden = false;
        console.log("Showing Detail Page");
    },
    onBackButton: function() {
        if (mainPage.hidden) {
            app.disconnect();
        } else {
            navigator.app.exitApp();
        }
    },
    onError: function(reason) {
        navigator.notification.alert(reason, app.showMainPage, 'Error');
    }
};

app.initialize();

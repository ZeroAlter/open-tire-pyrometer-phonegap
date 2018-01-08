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
var THERMOMETER_SERVICE = '142b8c89-28d2-4196-a978-6fcc64823422';
var DATA_CHARACTERISTIC = '9fe5ea27-1273-47f2-b0a6-abd53bfd3ac6';
var CONFIGURATION_CHARACTERISTIC = 'f000aa02-0451-4000-b000-000000000000';

// Based on code from http://bit.ly/sensortag-temp
var toCelsius = function(rawMeasurement) { // raw number should be unsigned 16 bit
    var SCALE_LSB = 0.03125;
    return (rawMeasurement >> 2) * SCALE_LSB;
};

var toFahrenheit = function(rawMeasurement) {
    var celsius = toCelsius(rawMeasurement);
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
        statusDivMain.innerHTML = "Scanning for BLE Devices";
        app.refreshDeviceList();
    },
    refreshDeviceList: function() {
        deviceList.innerHTML = ''; // empty the list
        statusDivMain.innerHTML = "Scanning for BLE Devices - Refresh";
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
        ble.connect(deviceId, app.onConnect, app.onError);
    },
    onConnect: function(peripheral) {
        app.peripheral = peripheral;

        // enable the temperature sensor
        // ble.write(
        //     peripheral.id,
        //     THERMOMETER_SERVICE,
        //     CONFIGURATION_CHARACTERISTIC,
        //     new Uint8Array([1]).buffer,
        //     app.showDetailPage,
        //     app.onError
        // );

        // subscribe to be notified when the button state changes
        ble.startNotification(
            peripheral.id,
            THERMOMETER_SERVICE,
            DATA_CHARACTERISTIC,
            app.onTemperatureChange,
            app.onError
        );
    },
    onTemperatureChange: function(buffer) {
        // expecting 2 unsigned 16 bit values
        var data = new Uint8Array(buffer);

        var rawInfraredTemp = data[0];
        var rawAmbientTemp = data[1];

        var unit = 'F';
        var infraredTemp = toFahrenheit(rawInfraredTemp);
        var ambientTemp = toFahrenheit(rawAmbientTemp);
        // var unit = 'C';
        // var infraredTemp = toCelsius(rawInfraredTemp);
        // var ambientTemp = toCelsius(rawAmbientTemp);

        var message = 'Infrared: ' + infraredTemp.toFixed(1) + ' &deg;' + unit + '<br/>' +
                      'Ambient:  ' + ambientTemp.toFixed(1) + ' &deg;' + unit + '<br/>';

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

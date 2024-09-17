// ==UserScript==
// @id             iitc-plugin-reverse-china-offset-portal-marker@Xelminoe
// @name           IITC plugin: Reverse China Offset Portal Marker
// @category       Portal Info
// @version        0.1.0
// @namespace      *
// @updateURL      *
// @downloadURL    *
// @description    Adds a button to portal info to create a marker at the reverse China offset location of the portal.
// @include        https://intel.ingress.com/*
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
    if (typeof window.plugin !== 'function') window.plugin = function() {};

    window.plugin.reversePortalMarker = function() {};
    var self = window.plugin.reversePortalMarker;

    // WGS84 to GCJ-02 transformer
    var WGS84transformer = function() {};
    WGS84transformer.prototype.a = 6378245.0;
    WGS84transformer.prototype.ee = 0.00669342162296594323;

    WGS84transformer.prototype.transform = function(wgLat, wgLng) {
        if (this.isOutOfChina(wgLat, wgLng))
            return {lat: wgLat, lng: wgLng};

        var dLat = this.transformLat(wgLng - 105.0, wgLat - 35.0);
        var dLng = this.transformLng(wgLng - 105.0, wgLat - 35.0);
        var radLat = wgLat / 180.0 * Math.PI;
        var magic = Math.sin(radLat);
        magic = 1 - this.ee * magic * magic;
        var sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((this.a * (1 - this.ee)) / (magic * sqrtMagic) * Math.PI);
        dLng = (dLng * 180.0) / (this.a / sqrtMagic * Math.cos(radLat) * Math.PI);
        var mgLat = wgLat + dLat;
        var mgLng = wgLng + dLng;

        return {lat: mgLat, lng: mgLng};
    };

    WGS84transformer.prototype.isOutOfChina = function(lat, lng) {
        return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
    };

    WGS84transformer.prototype.transformLat = function(x, y) {
        var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
        return ret;
    };

    WGS84transformer.prototype.transformLng = function(x, y) {
        var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
        return ret;
    };

    var WGS84toGCJ02 = new WGS84transformer();

    self.calculateReversePosition = function(lat, lng) {
        var gcj02 = WGS84toGCJ02.transform(lat, lng);
        // Calculate the reverse position
        var reverseLat = 2 * lat - gcj02.lat;
        var reverseLng = 2 * lng - gcj02.lng;
        return {lat: reverseLat, lng: reverseLng};
    };

    self.addMarkerAtReversePosition = function(portal) {
        var portalLatLng = portal.getLatLng();
        var reverseLatLng = self.calculateReversePosition(portalLatLng.lat, portalLatLng.lng);
        
        L.marker(reverseLatLng, {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/IITC-CE/ingress-intel-total-conversion/master/images/marker-icon.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
            }),
            title: 'Reverse position of ' + portal.options.data.title
        }).addTo(window.map);
    };

    self.addReverseButton = function() {
            const link = document.createElement('a');
            link.textContent = 'Add Reverse Marker';
            link.addEventListener('click', self.onReverseClick);
        
            const div = document.createElement('div');
            div.appendChild(link);
            const aside = document.createElement('aside');
            aside.appendChild(div);
            $("div.linkdetails").append(aside);
        };

    self.onReverseClick = function() {
        if (window.selectedPortal) {
            var portal = window.portals[window.selectedPortal];
            if (portal) {
                self.addMarkerAtReversePosition(portal);
            }
        }
    };

    var setup = function() {
        window.addHook('portalDetailsUpdated', self.addReverseButton);
    };

    setup.info = plugin_info;
    if(!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);
    if(window.iitcLoaded && typeof setup === 'function') setup();
}

var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
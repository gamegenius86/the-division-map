
(function() {
    'use strict';

    angular.module('theDivisionAgent', [
        // External Libraries
        'ui.router',
        'ui.bootstrap',
        'ngAnimate',
        'angular-clipboard',
        'angular-google-gapi',
        'angulartics',
        'angulartics.google.analytics',
        'angular-svg-round-progressbar',
        'rzModule',
        'LocalStorageModule',

        // Internal Modules
        'theDivisionAgent.home',
        'theDivisionAgent.news',
        'theDivisionAgent.map',
        'theDivisionAgent.builds',
        'theDivisionAgent.equipment'
    ]);

    angular.module('theDivisionAgent')
        .config(["$stateProvider", "$urlRouterProvider", "$locationProvider", function($stateProvider, $urlRouterProvider, $locationProvider) {
            $urlRouterProvider.otherwise('/home');
            $locationProvider.html5Mode(true).hashPrefix('*');
        }]);


    angular.module('theDivisionAgent')
        .run(['$rootScope', '$state', '$stateParams', 'GoogleURLShortener',
            function ($rootScope, $state, $stateParams, GoogleURLShortener) {
                $rootScope.$state = $state;
                $rootScope.$stateParams = $stateParams;
                $rootScope.windowInnerWidth = window.innerWidth;
                GoogleURLShortener.init('AIzaSyDdlHtYINPk3rVMKAlrQHj_IFgKdQcvU-M');
            }
        ]);

}());

(function() {
    'use strict';

    angular.module('theDivisionAgent.equipment', []);

    angular.module('theDivisionAgent.equipment')
        .config(["$stateProvider", function($stateProvider) {
            $stateProvider
                .state('equipment', {
                    url: '/equipment?slot',
                    templateUrl: 'modules/equipment/equipment.html',
                    controller: 'EquipmentController',
                    controllerAs: 'vm',
                    params: {
                        slot: { value: '', squash: true },
                    }
                });
        }]);
}());

(function() {
    'use strict';

    angular.module('theDivisionAgent.home', []);

    angular.module('theDivisionAgent.home')
        .config(["$stateProvider", function($stateProvider) {
            $stateProvider
                .state('home', {
                    url: '/home',
                    templateUrl: 'modules/home/home.html',
                    controller: 'HomeController',
                    controllerAs: 'vm'
                });
        }]);
}());

(function() {
    'use strict';

    angular.module('theDivisionAgent.map', []);

    angular.module('theDivisionAgent.map')
        .config(["$stateProvider", function($stateProvider) {
            $stateProvider
                .state('map', {
                    url: '/map?path&center&zoom&debug',
                    templateUrl: 'modules/map/controllers/map/map.html',
                    controller: 'MapController',
                    controllerAs: 'vm'
                });
        }]);
}());

(function() {
    'use strict';

    angular.module('theDivisionAgent.news', []);

    angular.module('theDivisionAgent.news')
        .config(["$stateProvider", function($stateProvider) {
            $stateProvider
                .state('news', {
                    url: '/news/{slug}',
                    templateUrl: function (stateParams){
                        return 'modules/news/news-' + stateParams.slug + '.html';
                    }
                });
        }]);
}());

(function() {
    'use strict';

    angular.module('theDivisionAgent.map')
        .controller('MapController', MapController);

    MapController.$inject = ['$scope', '$rootScope', '$stateParams', '$timeout', '$document', '$window', '$interval', 'GoogleURLShortener', 'localStorageService'];
    function MapController($scope, $rootScope, $stateParams, $timeout, $document, $window, $interval, GoogleURLShortener, localStorageService){
        var vm = this;

        vm.initialized = false;
        vm.menuCollapsed = ($window.innerWidth < 768);
        vm.tab = 'filters';

        $timeout(function(){ vm.initialized = true; }, 100);
        vm.toggleMenu = function(){
            vm.menuCollapsed = !vm.menuCollapsed;
        };
        vm.showTab = function(tabName){
            if(vm.menuCollapsed || vm.tab === tabName)
                vm.toggleMenu();
            vm.tab = tabName;
        };


        //
        // Zoom In / Out
        //


        vm.zoomAtMin = false;
        vm.zoomAtMax = false;
        vm.zoomDecrease = function(){
            $scope.$broadcast('map-decrease-zoom-level', updateZoomSettings);
        };
        vm.zoomIncrease = function(){
            $scope.$broadcast('map-increase-zoom-level', updateZoomSettings);
        };

        $scope.$on('map-zoom-changed', function(e, atMinimumZoom, atMaximumZoom){
            $scope.$apply(function(){
                updateZoomSettings(e, atMinimumZoom, atMaximumZoom);
            });
        });

        function updateZoomSettings(e, atMinimumZoom, atMaximumZoom){
            vm.zoomAtMin = atMinimumZoom;
            vm.zoomAtMax = atMaximumZoom;
        }


        //
        // Full Screen
        //


        vm.fullscreenEnabled = (document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled);
        vm.fullscreenActive = false;
        vm.toggleFullscreen = function(){
            if( vm.fullscreenEnabled ){
                if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
                    // exit full-screen
                    if (document.exitFullscreen) {
                    	document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                    	document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                    	document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                    	document.msExitFullscreen();
                    }
                } else {
                    var i = document.getElementById("the-division-agent-site");
                    // go full-screen
                    if (i.requestFullscreen) {
                        i.requestFullscreen();
                    } else if (i.webkitRequestFullscreen) {
                        i.webkitRequestFullscreen();
                    } else if (i.mozRequestFullScreen) {
                        i.mozRequestFullScreen();
                    } else if (i.msRequestFullscreen) {
                        i.msRequestFullscreen();
                    }
                }
            }
        };
        $document.on("fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange", function() {
            $scope.$apply(function(){
                vm.fullscreenActive = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
            });
        });


        //
        // Map Filter Tab
        //


        $scope.slider = {
            value: localStorageService.get('map-icon-scale') || 1,
            options: {
                floor: 0.5,
                ceil: 1,
                step: 0.1,
                precision: 1,
                showTicksValues: true,
                onChange: function(sliderId, modelValue, highValue){
                    $scope.$broadcast('map-marker-size', modelValue);
                }
            }
        };

        vm.filters = [
            { enabled: filterEnabled('Checkpoints'),     markerType: 'Checkpoints',     icon: "/img/icons/checkpoint.svg",       name: "Checkpoints" },
            { enabled: filterEnabled('DZEntrances'),     markerType: 'DZEntrances',     icon: "/img/icons/dz-enterance.svg",     name: "DZ Entrances" },
            { enabled: filterEnabled('SafeHouses'),      markerType: 'SafeHouses',      icon: "/img/icons/saferoom.svg",         name: "Safe Houses" },
            { enabled: filterEnabled('Extractions'),     markerType: 'Extractions',     icon: "/img/icons/extraction.svg",       name: "Extractions" },
            { enabled: filterEnabled('Landmarks'),       markerType: 'Landmarks',       icon: "/img/icons/landmark-off.svg",     name: "Landmarks" },
            { enabled: filterEnabled('ContaminatedZone'), markerType: 'ContaminatedZone', icon: "/img/icons/containment-zone.svg", name: "Contaminated Zones" },
            { enabled: filterEnabled('SubwayEntrances'), markerType: 'SubwayEntrances', icon: "/img/icons/subway.svg",           name: "Subway Entrances"},
            { enabled: filterEnabled('DivisionTech'),    markerType: 'DivisionTech',    icon: "/img/icons/division-tech.svg",    name: "Division Tech" },
            { enabled: filterEnabled('DarkZoneChests'),  markerType: "DarkZoneChests",  icon: "/img/icons/darkzone-chest.svg",   name: "Dark Zone Chests"},
            // { enabled: filterEnabled('DDZRank30Chests'), markerType: "DZRank30Chests",  icon: "/img/icons/dz-rank30-chest.png",  name: "Dark Zone Rank 30 Chests"},
            { enabled: filterEnabled('NamedBosses'),     markerType: 'NamedBosses',     icon: "/img/icons/enemy-named.svg",      name: "Named Bosses" },
            { enabled: filterEnabled('SupplyDrops'),     markerType: 'SupplyDrops',     icon: "/img/icons/supply-drop.svg",      name: "Supply Drops" },
        ];

        function filterEnabled(key){
            return localStorageService.get('map-filter-'+key.toLowerCase()) !== false;
        }

        vm.toggleFilter = function(filter){
            filter.enabled = !filter.enabled;
            localStorageService.set('map-filter-'+filter.markerType.toLowerCase(), filter.enabled);
            if( filter.markerType !== null)
                $scope.$broadcast('map-switch-filter', filter.markerType, filter.enabled);
        };

        vm.toggleAllFilters = function(){
            var status = !_.find(vm.filters, {enabled: true});
            _.each(vm.filters, function(filter){
                filter.enabled = status;
                localStorageService.set('map-filter-'+filter.markerType.toLowerCase(), filter.enabled);
                if( filter.markerType !== null )
                    $scope.$broadcast('map-switch-filter', filter.markerType, filter.enabled);
            });
        };


        //
        // Custom Path Tab
        //


        if($stateParams.path) {
            getShareableURL($stateParams.path);
            var points = $stateParams.path.split('_');
            points = _.map(points, function(pt){
                var latlng = pt.split(',');
                return [+latlng[0], +latlng[1]];
            });
            $timeout(function(){
                $scope.$broadcast('map-pathing-init', points);
            }, 100);
        }

        vm.pathing = false;
        vm.shareableUrl = null;
        var pathArray = [];
        vm.beginPathing = function(){
            vm.pathing = true;
            vm.shareableUrl = null;
            $scope.$broadcast('map-pathing', true);
        };
        vm.endPathing = function(){
            vm.pathing = false;
            $scope.$broadcast('map-pathing', false);

            var pathStr = "";
            _.each(pathArray, function(point){
                if(pathStr !== "")
                    pathStr = pathStr + "_";
                pathStr = pathStr + point[0] + "," + point[1];
            });
            getShareableURL(pathStr);
            pathArray = [];
        };
        vm.undoLastPath = function(){
            $scope.$broadcast('map-pathing-undo');
        };

        function getShareableURL(pathStr){
            var longUrl = "http://thedivisionagent.com/map?path="+pathStr;
            GoogleURLShortener.shorten(longUrl).then(function(shortUrl){
                vm.shareableUrl = shortUrl;
            }, function(){
                vm.shareableUrl = "Error";
            });
        }

        $scope.$on('map-pathing-update', function(event, newPathArray){
            pathArray = newPathArray;
        });

        //
        // Timer Tab
        //

        vm.timersEnabled = false;
        vm.activeTimers = [];

        vm.toggleTimerMode = function(state){
            vm.timersEnabled = state;
            $scope.$broadcast('map-timer-toggle', state);
            if(!state){
                vm.activeTimers = [];
            }
        };

        vm.locateMarker = function(marker){
            $scope.$broadcast('map-marker-center', marker);
            $scope.$broadcast('map-marker-pulse', marker);
        };

        function setupTimerLocation(location) {
            location.respawnTime = moment().add(location.respawn, 'seconds');
            location.respawnTimeTotal = location.respawn * 1000;
            location.respawnMilli = location.respawn * 1000;
            location.respawned = false;
        }

        vm.resetTimer = function(location) {
            setupTimerLocation(location);
        };

        $scope.$on('map-timer-start', function(event, marker, location){
            console.log("$on", Date.now());
            if( !_.find(vm.activeTimers, {id: location.id}) ){
                setupTimerLocation(location);
                location.type = marker.typeFriendly;
                vm.activeTimers.push(location);
                $scope.$apply();
            }
        });

        $interval(function(){
            var current = moment();
            var grace_period = moment().add(2, 'minutes');
            _.each(vm.activeTimers, function(location){
                if(location){
                    location.respawnMilli = location.respawnTime.diff(current);
                    if( location.respawnMilli <= -120000 ){
                        _.remove(vm.activeTimers, location);
                    } else if( location.respawnMilli <= 0 && !location.respawned ){
                        location.respawned = true;
                        vm.locateMarker(location);
                        // play sound
                    }
                }
            });
        }, 1000);

        return vm;
    }

}());

!function(window,angular,undefined){"use strict";angular.module("angulartics.google.analytics",["angulartics"]).config(["$analyticsProvider",function($analyticsProvider){function setDimensionsAndMetrics(properties){if(window.ga)for(var idx=1;200>=idx;idx++)properties["dimension"+idx.toString()]&&ga("set","dimension"+idx.toString(),properties["dimension"+idx.toString()]),properties["metric"+idx.toString()]&&ga("set","metric"+idx.toString(),properties["metric"+idx.toString()])}$analyticsProvider.settings.pageTracking.trackRelativePath=!0,$analyticsProvider.settings.ga={additionalAccountNames:undefined,userId:null},$analyticsProvider.registerPageTrack(function(path){window._gaq&&(_gaq.push(["_trackPageview",path]),angular.forEach($analyticsProvider.settings.ga.additionalAccountNames,function(accountName){_gaq.push([accountName+"._trackPageview",path])})),window.ga&&($analyticsProvider.settings.ga.userId&&ga("set","&uid",$analyticsProvider.settings.ga.userId),ga("send","pageview",path),angular.forEach($analyticsProvider.settings.ga.additionalAccountNames,function(accountName){ga(accountName+".send","pageview",path)}))}),$analyticsProvider.registerEventTrack(function(action,properties){if(properties&&properties.category||(properties=properties||{},properties.category="Event"),properties.value){var parsed=parseInt(properties.value,10);properties.value=isNaN(parsed)?0:parsed}if(window.ga){var eventOptions={eventCategory:properties.category,eventAction:action,eventLabel:properties.label,eventValue:properties.value,nonInteraction:properties.noninteraction,page:properties.page||window.location.hash.substring(1)||window.location.pathname,userId:$analyticsProvider.settings.ga.userId};setDimensionsAndMetrics(properties),$analyticsProvider.settings.ga.transport?ga("send","event",eventOptions,{transport:$analyticsProvider.settings.ga.transport}):ga("send","event",eventOptions),angular.forEach($analyticsProvider.settings.ga.additionalAccountNames,function(accountName){ga(accountName+".send","event",eventOptions)})}else window._gaq&&_gaq.push(["_trackEvent",properties.category,action,properties.label,properties.value,properties.noninteraction])}),$analyticsProvider.registerExceptionTrack(function(properties){return properties&&properties.appId&&properties.appName&&properties.appVersion?(properties.fatal===undefined&&(console.log('No "fatal" provided, sending with fatal=true'),properties.exFatal=!0),properties.exDescription=properties.description,void ga("send","exception",properties)):void console.error("Must be setted appId, appName and appVersion.")}),$analyticsProvider.registerSetUsername(function(userId){$analyticsProvider.settings.ga.userId=userId}),$analyticsProvider.registerSetUserProperties(function(properties){setDimensionsAndMetrics(properties)}),$analyticsProvider.registerUserTimings(function(properties){return properties&&properties.timingCategory&&properties.timingVar&&properties.timingValue?void(window.ga&&ga("send","timing",properties)):void console.error("Properties timingCategory, timingVar, and timingValue are required to be set.")})}])}(window,window.angular);

// Mouse Position Plugin
L.Control.MousePosition = L.Control.extend({
    options: {
        position: 'bottomleft'
    },
    onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
        L.DomEvent.disableClickPropagation(this._container);
        map.on('mousemove', this._onMouseMove, this);
        return this._container;
    },
    onRemove: function (map) {
        map.off('mousemove', this._onMouseMove);
    },
    _onMouseMove: function (e) {
        var lng = L.Util.formatNum(e.latlng.lng, 2).toFixed(2);
        var lat = L.Util.formatNum(e.latlng.lat, 2).toFixed(2);
        this._container.innerHTML = lat + " : " + lng;
    }
});
L.Map.mergeOptions({ positionControl: false });
L.Map.addInitHook(function () {
    if (this.options.positionControl) {
        this.positionControl = new L.Control.MousePosition();
        this.addControl(this.positionControl);
    }
});
L.control.mousePosition = function (options) {
    return new L.Control.MousePosition(options);
};
// End Mouse Position

(function() {
    'use strict';

    angular.module('theDivisionAgent')
        .service('GoogleURLShortener', GoogleURLShortener);

    GoogleURLShortener.$inject = ['GApi', 'GClient', '$q'];
    function GoogleURLShortener(GApi, GClient, $q){
        var service = {};

        service.init = function(api_key){
            GApi.load('urlshortener','v1',function(){});
            GClient.setApiKey(api_key);
        };

        service.shorten = function(longUrl){
            return GApi.execute('urlshortener', 'url.insert', {'longUrl': longUrl}).then(function(response) {
                return response.id;
            });
        };

        return service;
    }


}());

(function() {
    'use strict';

    angular.module('theDivisionAgent')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$state', '$stateParams'];
    function HomeController($state, $stateParams){
        var vm = this;

        vm.routes = [
            { id: 1, types: ['Division Tech'], name: 'Entire Map Division Tech Farming',      popularity: 21758, zoom: 3, center: [-66, 40], path: '-76.0,82.7_-75.9,55.4_-78.2,52.7_-72.4,52.9_-72.3,31.6_-61.8,31.8_-62.1,47.9_-54.8,48.3_-55.0,75.7_-51.2,75.2_-51.1,70.1_-47.0,69.3_-47.0,60.6_-42.0,60.8_-46.9,58.7_-46.7,25.0_-37.3,24.9_-36.9,11.7_-25.6,11.8_-25.3,31.6_-13.4,32.1_-13.6,79.4_-12.8,59.2_2.4,59.2_2.4,53.7_6.5,53.6_8.1,51.2_9.5,53.6_15.1,53.4_15.0,64.8_13.5,68.6_16.3,65.2_16.3,59.3_27.3,59.5_27.5,31.8_34.5,34.0_27.5,30.7_27.4,27.8_29.5,28.0_27.5,26.4_28.2,18.5_26.8,11.2_23.0,11.5_21.4,15.9_22.9,10.3_27.5,9.9_28.4,12.8_38.1,12.9_38.5,-2.4_42.0,-2.0_44.5,0.5_47.6,3.8_47.5,10.9_44.9,15.8_48.2,11.8_50.0,9.9_55.3,11.0_55.8,18.6_59.2,20.3_62.3,18.1_62.1,10.8_63.4,10.1_67.5,10.9_67.7,-6.7_70.0,-7.0_67.7,-8.3_68.3,-27.6_70.0,-25.3_72.0,-23.9_72.2,-34.6_74.0,-36.0_72.0,-36.9_72.7,-43.6_72.1,-52.2_70.3,-53.2_72.2,-53.1_72.1,-68.7_72.7,-68.7_73.0,-66.5_72.9,-70.0_71.1,-70.0_71.0,-66.5_70.8,-70.0_66.5,-70.2_65.5,-66.5_64.3,-67.7_63.4,-70.4_62.3,-70.3_55.9,-70.3_55.6,-45.7_57.0,-42.0_53.0,-42.0_48.2,-42.7_48.0,-62.0_47.5,-36.4_43.5,-35.0_38.5,-35.7_37.5,-41.0_38.8,-65.3' },
            { id: 2, types: ['Leveling'],      name: 'Darkzone 1-2 Leveling / Farming Route', popularity: 17539, zoom: 3, center: [-68, 58], path: '-76.0,82.7_-75.8,53.3_-78.2,52.7_-74.9,52.2_-74.8,54.0_-72.4,53.1_-72.3,41.4_-68.2,39.3_-68.1,32.2_-63.7,32.3_-63.8,34.3_-63.0,34.0_-62.9,37.1_-62.2,37.1_-62.1,48.2_-54.9,48.2_-54.9,59.2_-43.8,59.9_-41.0,63.0_-43.1,58.9_-46.4,58.7_-46.5,30.3_-39.3,30.2_-39.4,21.9_-46.6,21.4_-46.9,17.4_-54.6,17.3_-54.7,11.0_-58.3,10.8_-58.4,8.2_-60.9,8.3_-63.0,2.1_-63.2,-2.5_-66.5,-2.6_-67.3,-11.3_-71.0,-10.6_-71.1,-14.8_-71.8,-14.9_-72.3,-9.5_-75.8,-2.0_-75.9,52.4' },
            { id: 3, types: ['Leveling'],      name: 'Darkzone 3-4 Leveling / Farming Route', popularity: 14731, zoom: 4, center: [2, 30], path: '1.9,67.5_1.6,33.4_-13.3,33.3_-13.4,30.5_-0.1,29.7_-0.5,23.3_-6.8,22.7_-5.3,3.1_-2.2,3.2_-1.9,-4.0_-12.8,-6.6_-12.7,-20.0_-23.8,-13.4_-23.6,-17.2_-20.5,-17.7_-20.3,-25.9_-7.8,-25.8_-7.7,-19.0_-1.8,-17.5_-1.7,-12.2_4.7,-4.9_15.4,-5.4_15.9,16.2_19.6,16.0_15.5,20.2_15.7,31.9_28.0,32.0_27.3,59.5_1.8,59.1' },
            { id: 4, types: ['Leveling'],      name: 'Darkzone 5-6 Leveling / Farming Route', popularity: 11973, zoom: 4, center: [64, -17], path: '67.7,-80.0_67.5,-70.7_55.8,-70.0_55.7,-22.8_62.3,-23.0_61.9,10.5_61.4,12.9_62.6,11.4_67.7,11.3_67.5,14.7_68.7,14.3_69.7,8.3_69.8,1.6_71.9,1.5_72.1,-22.5_72.8,-23.0_72.1,-24.0_72.2,-41.2_71.7,-42.5_71.6,-60.8_73.4,-60.8_74.0,-62.2_73.5,-64.2_72.6,-65.0_72.6,-70.8_67.6,-70.8' },
        ];

        return vm;
    }

}());

(function() {
    'use strict';

    angular.module('theDivisionAgent')
        .controller('EquipmentController', EquipmentController);

    EquipmentController.$inject = ['$state', '$stateParams'];
    function EquipmentController($state, $stateParams){
        var vm = this;

        vm.slot = null;
        vm.equipment = {
            "Chest": {
                "Base": {
                    "List": [
                        { name: "Armor",                           low: "706",   high: "864"   },
                    ]
                },
				"Primary": {
                    "Limit": "1",
                    "List": [
                        { name: "Firearms",                        low: "470",   high: "575"   },
                        { name: "Stamina",                         low: "470",   high: "575"   },
                        { name: "Electronics",                     low: "470",   high: "575"   },
                    ]
                },
                "Major": {
                    "Limit": "3",
                    "List": [
                        { name: "Armor",                           low: "470",   high: "575"   },
                        { name: "Damage to Elites",                low: "7%",    high: "8%"    },
                        { name: "Exotic Damage Resilence",         low: "11%",   high: "14%"   },
                        { name: "Health",                          low: "2,353", high: "2,878" },
                        { name: "Health on Kill",                  low: "9%",    high: "11%"   },
                        { name: "Protection from Elites",          low: "9%",    high: "11%"   },
                        { name: "+1 Gear Mod Slot"                                             },
                    ],
                },
                "Minor": {
                    "Limit": "1",
                    "List": [
                        { name: "Ammo Capacity",                   low: "38%",   high: "47%"   },
                        { name: "Increase Kill XP",                low: "19%",   high: "23%"   },
                    ],
                },
                "Skill": {
                    "Limit": "1",
                    "List": [
                        { name: "Ballistic Shield Health",         low: "7.5%",  high: "9%"    },
                        { name: "First Aid Self Heal",             low: "7.5%",  high: "9%"    },
                        { name: "Mobile Cover Damage Resilence",   low: "2.5%",  high: "3%"    },
                        { name: "Pulse Duration",                  low: "7.5%",  high: "9%"    },
                        { name: "Seeker Mine Explosion Radius",    low: "7.5%",  high: "9%"    },
                        { name: "Smart Cover Damage Resilience",   low: "2.5%",  high: "3%"    },
                        { name: "Sticky Bomb Damage",              low: "7.5%",  high: "9%"    },
                        { name: "Support Station Health",          low: "7.5%",  high: "9%"    },
                        { name: "Turrent Health",                  low: "7.5%",  high: "9%"    },
                    ]
                },
                "Talents": [
                    { name: "Forceful",       description: "Your armor is increased by x% while your Signature Skill is enabled" },
                    { name: "Rapid",          description: "The cool down of your healing skills is decreased by x%" },
                    { name: "Reckless",       description: "You deal (12.5% - 13%) more damage and receive 10% more damage" },
                    { name: "Robust",         description: "You have 45% more armor while in cover" },
                    { name: "Vigorous",       description: "All of your healing skills have Over Heal enabled" },
                ]
            },
            "Mask": {
                "Base": {
                    "List": [
                        { name: "Armor",                           low: "353",   high: "431"   },
                        { name: "+1 Gear Mod Slot",                                            },
                    ]
                },
                "Primary": {
                    "Limit": "1",
                    "List": [
                        { name: "Firearms",                        low: "470",   high: "575"   },
                        { name: "Stamina",                         low: "470",   high: "575"   },
                        { name: "Electronics",                     low: "470",   high: "575"   },
                    ]
                },
                "Major": {
                    "Limit": "1",
                    "List": [
                        { name: "Critical Hit Chance",             low: "4%",    high: "5%"    },
                        { name: "Damage to Elites",                low: "9%",    high: "11%"   },
                        { name: "Exotic Damage Resilience",        low: "11%",   high: "14%"   },
                        { name: "Health",                          low: "1,769", high: "2,164" },
                        { name: "Health on Kill",                  low: "9%",    high: "11%"   },
                        { name: "Skill Power",                     low: "3,539", high: "4,328" },
                        { name: "+1 Gear Mod Slot"                                             },
                    ],
                },
                "Minor": {
                    "Limit": "1",
                    "List": [
                        { name: "Blind/Deaf Resistance",           low: "11%",   high: "13%"   },
                        { name: "Burn Resistance",                 low: "11%",   high: "13%"   },
                        { name: "Disorient Resistance",            low: "11%",   high: "13%"   },
                        { name: "Enemy Armor Damage",              low: "6%",    high: "7%"    },
                        { name: "Increase Kill XP",                low: "9%",    high: "11%"   },
                        { name: "Scavenging",                      low: "19%",   high: "23%"   },
                    ],
                },
                "Skill": {
                    "Limit": "1",
                    "List": [
                        { name: "Ballistic Shield Health",         low: "7.5%",  high: "9%"    },
                        { name: "First Aid Ally Heal",             low: "7.5%",  high: "9%"    },
                        { name: "Mobile Cover Damage Resilience",  low: "2.5%",  high: "3%"    },
                        { name: "Pulse Critical Hit Damage Bonus", low: "2.5%",  high: "3%"    },
                        { name: "Seeker Mine Explosion Radius",    low: "7.5%",  high: "9%"    },
                        { name: "Smart Cover Duration",            low: "7.5%",  high: "9%"    },
                        { name: "Sticky Bomb Explosion Radius",    low: "7.5%",  high: "9%"    },
                        { name: "Support Station Healing Speed",   low: "7.5%",  high: "9%"    },
                        { name: "Turret Duration",                 low: "7.5%",  high: "9%"    },
                    ]
                },
                "Talents": [
                    { name: "Enduring",       description: "While in your last segment, your health continuously regenerates to fill up the segment" },
                    { name: "Refreshed",      description: "When your health is in the last segment, all healing is improved by 30%" },
                    { name: "Rehabilitated",  description: "When you are affected by a status effect you are healed for 2% every second" },
                    { name: "Rejuvenated",    description: "Consuming a medkit also removes all negative status effects from you" },
                    { name: "Tenacious",      description: "Using a medkit increases your damage by 9.5% for 10 seconds" },
                ]
            },
            "Backpack": {
                "Base": {
                    "List": [
                        { name: "Armor",                           low: "470",   high: "575"   },
						{ name: "Backpack Capacity",               low: "21",    high: "24"    },
                        { name: "+1 Gear Mod Slot",                                            },
                    ]
                },
                "Primary": {
                    "Limit": "1",
                    "List": [
                        { name: "Firearms",                        low: "470",   high: "575"   },
                        { name: "Stamina",                         low: "470",   high: "575"   },
                        { name: "Electronics",                     low: "470",   high: "575"   },
                    ]
                },
                "Major": {
                    "Limit": "1",
                    "List": [
                        { name: "Armor",                           low: "353",   high: "431"   },
                        { name: "Critical Hit Damage",             low: "15%",   high: "18%"   },
                        { name: "Signature Ability Resource Gain", low: "10%",   high: "12%"   },
                        { name: "Skill Haste",                     low: "10%",   high: "12%"   },
                        { name: "Skill Power",                     low: "4,707", high: "5,757" },
                    ],
                },
                "Minor": {
                    "Limit": "1",
                    "List": [
                        { name: "Ammo Capacity",                   low: "38%",   high: "47%"   },
                        { name: "Bleed Resistance",                low: "47%",   high: "57%"   },
                        { name: "Burn Resistance",                 low: "11%",   high: "13%"   },
                        { name: "Disrupt Resistance",              low: "11%",   high: "13%"   },
                    ],
                },
                "Skill": {
                    "Limit": "2",
                    "List": [
                        { name: "Ballisitc Shield Damage",         low: "2.5%",  high: "3%"    },
                        { name: "Ballistic Shield Health",         low: "7.5%",  high: "9%"    },
                        { name: "First Aid Ally Heal",             low: "7.5%",  high: "9%"    },
                        { name: "First Aid Self Heal",             low: "7.5%",  high: "9%"    },
                        { name: "Mobile Cover Damage Resilence",   low: "2.5%",  high: "3%"    },
                        { name: "Mobile Cover Health",             low: "7.5%",  high: "9%"    },
                        { name: "Pulse Critical Hit Damage",       low: "7.5%",  high: "9%"    },
                        { name: "Pulse Critical Hit Damage Bonus", low: "2.5%",  high: "3%"    },
                        { name: "Pulse Duration",                  low: "7.5%",  high: "9%"    },
                        { name: "Seeker Mine Damage",              low: "7.5%",  high: "9%"    },
                        { name: "Seeker Mine Explosion Radius",    low: "7.5%",  high: "9%"    },
                        { name: "Sticky Bomb Damage",              low: "7.5%",  high: "9%"    },
                        { name: "Sticky Bomb Explosion Radius",    low: "7.5%",  high: "9%"    },
                        { name: "Smart Cover Damage Increase",     low: "2.5%",  high: "3%"    },
                        { name: "Smart Cover Damage Resilience",   low: "2.5%",  high: "3%"    },
                        { name: "Smart Cover Duration",            low: "7.5%",  high: "9%"    },
                        { name: "Support Station Duration",        low: "7.5%",  high: "9%"    },
                        { name: "Support Station Healing Speed",   low: "7.5%",  high: "9%"    },
                        { name: "Support Station Health",          low: "7.5%",  high: "9%"    },
                        { name: "Turret Damage",                   low: "7.5%",  high: "9%"    },
                        { name: "Turret Duration",                 low: "7.5%",  high: "9%"    },
                        { name: "Turret Health",                   low: "7.5%",  high: "9%"    },
                    ]
                },
                "Talents": [
                    { name: "Inventive",      description: "Your skill power is increased by 13% while at full health" },
                    { name: "Relentless",     description: "3% of the damage dealt by your skills is returned to you as healing" },
                    { name: "Resourceful",    description: "All healing applied to you is also applied to your skill objects" },
                    { name: "Specialized",    description: "(12.5% - 13%) of your firearms and stamina is added to your skill power" },
                    { name: "Technical",      description: "While your signature skill is active, your skill power is increased by 13%" },
                ]
            },
            "Gloves": {
                "Base": {
                    "List": [
                        { name: "Armor",                           low: "353",   high: "431"   },
                    ]
                },
                "Primary": {
                    "Limit": "1",
                    "List": [
                        { name: "Firearms",                        low: "470",   high: "575"   },
                        { name: "Stamina",                         low: "470",   high: "575"   },
                        { name: "Electronics",                     low: "470",   high: "575"   },
                    ]
                },
                "Major": {
                    "Limit": "3",
                    "List": [
                        { name: "Assault Rifle Damage",            low: "470",   high: "575"   },
                        { name: "Critical Hit Chance",             low: "5%",    high: "6.5%"  },
                        { name: "Critical Hit Damage",             low: "30%",   high: "37%"   },
                        { name: "Damage to Elites",                low: "9%",    high: "11%"   },
                        { name: "Marksman Rifle Damage",           low: "1,651", high: "2,020" },
                        { name: "Health on Kill",                  low: "9%",    high: "11%"   },
                        { name: "LMG Damage",                      low: "470",   high: "575"   },
                        { name: "Pistol Damage",                   low: "470",   high: "575"   },
                        { name: "Shotgun Damage",                  low: "470",   high: "575"   },
                        { name: "SMG Damage",                      low: "353",   high: "431"   },
                    ],
                },
                "Minor": {
                    "Limit": "0",
                    "List": null
                },
                "Skill": {
                    "Limit": "1",
                    "List": [
                        { name: "Ballistic Shield Damage",         low: "2.5%",  high: "3%"    },
                        { name: "First Aid Self Heal",             low: "7.5%",  high: "9%"    },
                        { name: "Mobile Cover Health",             low: "7.5%",  high: "9%"    },
                        { name: "Pulse Critical Hit Damage",       low: "7.5%",  high: "9%"    },
                        { name: "Seeker Mine Damage",              low: "7.5%",  high: "9%"    },
                        { name: "Smart Cover Damage Increase",     low: "2.5%",  high: "3%"    },
                        { name: "Sticky Bomb Damage",              low: "7.5%",  high: "9%"    },
                        { name: "Support Station Duration",        low: "7.5%",  high: "9%"    },
                        { name: "Turret Damage",                   low: "7.5%",  high: "9%"    },
                    ]
                },
                "Talents": [
                    { name: "Astute",         description: "The first three bullets of your magazine have a 9.5% higher chance to do a critical hit" },
                    { name: "Cunning",        description: "After reloading, your next shot with this weapon has a 9.5% higher critical hit chance" },
                    { name: "Decisive",       description: "Headshots with your sidearm deal 25% more damage" },
                    { name: "Savage",         description: "Your critical hit chance is increased by 13% against targets out of cover" },
                ]
            },
            "Holster": {
                "Base": {
                    "List": [
                        { name: "Armor",                           low: "353",   high: "431"   },
                    ]
                },
                "Primary": {
                    "Limit": "2 or 3",
                    "List": [
                        { name: "Firearms",                        low: "470",   high: "575"   },
                        { name: "Stamina",                         low: "470",   high: "575"   },
                        { name: "Electronics",                     low: "470",   high: "575"   },
                    ]
                },
                "Major": {
                    "Limit": "1 or 2 (4 - number of primary attributes)",
                    "List": [
                        { name: "Armor",                           low: "353",   high: "431"   },
                        { name: "Pistol Damage",                   low: "235",   high: "287"   },
                        { name: "Protection from Elites",          low: "4%",    high: "5%"    },
                        { name: "Skill Haste",                     low: "7%",    high: "9%"    },
                        { name: "+1 Gear Mod Slot"                                             },
                    ],
                },
                "Minor": {
                    "Limit": "0",
                    "List": null
                },
                "Skill": {
                    "Limit": "1",
                    "List": [
                        { name: "Ballistic Shield Damage",         low: "2.5%",  high: "3%"    },
                        { name: "First Aid Ally Heal",             low: "7.5%",  high: "9%"    },
                        { name: "Mobile Cover Health",             low: "7.5%",  high: "9%"    },
                        { name: "Pulse Critical Hit Damage",       low: "7.5%",  high: "9%"    },
                        { name: "Seeker Mine Damage",              low: "7.5%",  high: "9%"    },
                        { name: "Smart cover Duration",            low: "7.5%",  high: "9%"    },
                        { name: "Sticky Bomb Damage",              low: "7.5%",  high: "9%"    },
                        { name: "Support Station Health",          low: "7.5%",  high: "9%"    },
                        { name: "Turret Duration",                 low: "7.5%",  high: "9%"    },
                    ]
                },
                "Talents": [
                    { name: "Nimble",         description: "While doing a cover to cover move in combat, you heal 2% of your max health for every y meter run" },
                    { name: "Recovered",      description: "Damage taken while doing a cover to cover maneuver is regenerated over 5 seconds upon reaching your destination" },
                    { name: "Steadfast",      description: "While in cover, health regeneration kicks in twice as fast" },
                    { name: "Sturdy",         description: "Your armor is increased by 12.5% when you stay more than y seconds in the same cover" },
                ]
            },
            "Kneepads": {
                "Base": {
                    "List": [
                        { name: "Armor",                           low: "588",   high: "719"   },
                    ]
                },
                "Primary": {
                    "Limit": "1",
                    "List": [
                        { name: "Firearms",                        low: "470",   high: "575"   },
                        { name: "Stamina",                         low: "470",   high: "575"   },
                        { name: "Electronics",                     low: "470",   high: "575"   },
                    ]
                },
                "Major": {
                    "Limit": "2",
                    "List": [
                        { name: "Armor",                           low: "235",   high: "287"   },
                        { name: "Critical Hit Damage",             low: "15%",   high: "18%"   },
                        { name: "Damage to Elites",                low: "4%",    high: "5%"    },
                        { name: "Exotic Damage Resilience",        low: "8.5%",  high: "10.5%" },
                        { name: "Health",                          low: "1,176", high: "1,439" },
                        { name: "Protection from Elites",          low: "4%",    high: "5%"    },
                        { name: "+1 Gear Mod Slot"                                             },
                    ],
                },
                "Minor": {
                    "Limit": "3",
                    "List": [
                        { name: "Bleed Resistance",                low: "94%",   high: "115%"  },
                        { name: "Blind/Deaf Resistance",           low: "22%",   high: "27%"   },
                        { name: "Burn Resistance",                 low: "22%",   high: "27%"   },
                        { name: "Disorient Resistance",            low: "22%",   high: "27%"   },
                        { name: "Disrupt Resistance",              low: "22%",   high: "27%"   },
                        { name: "Enemy Armor Damage",              low: "8%",    high: "9%"    },
                        { name: "Increase Kill XP",                low: "38%",   high: "47%"   },
                        { name: "Scavenging",                      low: "77%",   high: "94%"   },
                        { name: "Shock Resistance",                low: "22%",   high: "27%"   },
                    ],
                },
                "Skill": {
                    "Limit": "1",
                    "List": [
                        { name: "Ballisitc Shield Health",         low: "7.5%",  high: "9%"    },
                        { name: "First Aid Ally Heal",             low: "7.5%",  high: "9%"    },
                        { name: "Mobile Cover Health",             low: "7.5%",  high: "9%"    },
                        { name: "Pulse Critical Hit Damage",       low: "7.5%",  high: "9%"    },
                        { name: "Seeker Mine Explosion Radius",    low: "7.5%",  high: "9%"    },
                        { name: "Smart Cover Damage Resilience",   low: "2.5%",  high: "3%"    },
                        { name: "Sticky Bomb Explosion Radius",    low: "7.5%",  high: "9%"    },
                        { name: "Support System Healing Speed",    low: "7.5%",  high: "9%"    },
                        { name: "Turret Health",                   low: "7.5%",  high: "9%"    },
                    ]
                },
                "Talents": [
                    { name: "Accomplished",   description: "Rewards from accolades are tripled" },
                    { name: "Perceptive",     description: "Your Item find and Credit find bonuses are increased by 25%" },
                    { name: "Prosperous",     description: "Critical headshots grant you credits" },
                ]
            },
            "Weapon": {
                "Talents": [
                    { name: "Accurate",       description: "Accuracy is increased by x%" },
                    { name: "Adept",          description: "Skill increases your critical hit chance by 3% for y seconds" },
                    { name: "Balanced",       description: "Weapon acquires maximum accuracy faster when shouldered" },
                    { name: "Brutal",         description: "Headshot damage is increased by x% when using this weapon" },
                    { name: "Capable",        description: "Using a skill improves the handling of your weapon for x seconds" },
                    { name: "Commanding",     description: "Every kill performed while the signature skill is active extends its duration by x%" },
                    { name: "Coolheaded",     description: "Performing a headshot reduces all skill cooldowns by x%" },
                    { name: "Deadly",         description: "Critical hit damage is increased by x%" },
                    { name: "Destructive",    description: "Armor destruction value is increased by x% when using this weapon" },
                    { name: "Determined",     description: "Killing a target reduces skill cooldowns by x%" },
                    { name: "Dominant",       description: "Every kill while your signature skill is active reduces the cooldown of your other skills by x%" },
                    { name: "Expert",         description: "This weapon deals x% more damage when the target is below y% health" },
                    { name: "Ferocious",      description: "Damage against elite and named enemies is increased by x%" },
                    { name: "Fierce",         description: "Critical hit chance is increased by x% when using this weapon" },
                    { name: "Fordern",        description: "Kills by active skills prolong their duration by x%" },
                    { name: "Harmful",        description: "Each hit has a x% chance to apply the 'bleed' status effect" },
                    { name: "Intense",        description: "The first bullet of a magazine has a x% chance to apply the 'on fire' status effect" },
                    { name: "Meticulous",     description: "Killing a target has a x% chance to instantly refill the magazine" },
                    { name: "Predatory",      description: "Killing a target regenerates x% health over y seconds" },
                    { name: "Prepared",       description: "Damage is increased by x% when more than 40 meters from the target" },
                    { name: "Proficient",     description: "The first bullet shot when out of combat has a x% chance to result in a critical hit" },
                    { name: "Provident",      description: "The last bullet in your magazine deal x% bonus damage" },
                    { name: "Responsive",     description: "Damage is increased by 5% when closer than 10 meters to the target" },
                    { name: "Restored",       description: "Killing a target with this weapon removes all negative status effects" },
                    { name: "Stable",         description: "Stability is improved by x%" },
                    { name: "Sustained",      description: "Killing a target increases your health by x%" },
                    { name: "Skilled",        description: "Headshot kills with this weapon increase signature skill resources by x%" },
                    { name: "Swift",          description: "Reloading is x% faster" },
                    { name: "Self-preserved", description: "Critical hits with this weapon heal the user for x% of damage dealt" },
                    { name: "Talented",       description: "Killing a target with this weapon increases skill power by x% for y seconds" },
                    { name: "Toxic",          description: "Headshots with this weapon have a x% chance to apply the 'blind' status effect" },
                    { name: "Trained",        description: "Critical hits increase signature skill resources by 0.10% (only applies to shotguns, pistols and marksman rifles)" },
                    { name: "Unforgiving",    description: "Missing health segments increases your damage by x%" },
                    { name: "Vicious",        description: "Critical hit chance is increased by x% while at full health" }
                ]
            }
        };

        vm.selectSlot = function(slot){
            vm.slot = (vm.slot === slot ? undefined : slot);
            $state.go('.', {slot: vm.slot}, {notify: false});
        };


        return vm;
    }

}());

(function() {
    'use strict';

    angular.module('theDivisionAgent')
        .directive('footer', footer);

    function footer(){
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'common/directives/footer/footer.html'
        };
    }
}());

(function() {
    angular
        .module('theDivisionAgent')
        .directive('tdaCloseMenu', tdaCloseMenu);

    tdaCloseMenu.$inject = ['$window'];
    function tdaCloseMenu($window) {
        return {
            restrict: 'A',
            link: function(scope, elem, attr) {
                $(elem).on('click', function(){
                    if( $window.innerWidth < 768 ) {
                        $(elem).closest('nav').find('button.navbar-toggle').click();
                    }
                });
            }
        };
    }
})();

(function() {
    'use strict';

    angular.module('theDivisionAgent')
        .directive('header', header);

    function header(){
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'common/directives/header/header.html',
            controller: HeaderController,
            controllerAs: 'vm'
        };
    }

    HeaderController.$inject = ['$uibModal'];
    function HeaderController($uibModal){
        var vm = this;

        return vm;
    }
}());

(function() {
    angular
        .module('theDivisionAgent')
        .directive('tdaPopover', tdaPopover);

    function tdaPopover() {
        return {
            restrict: 'A',
            link: function(scope, elem, attr) {
                function buildPopover() {
                    $(elem).popover({
                        title: attr.popoverTitle,
                        content: attr.tdaPopover,
                        html: true,
                        animation: false,
                        trigger: 'hover',
                        placement: attr.popoverPosition,
                        delay: {show: parseInt(attr.popoverDelay || 400), hide: (parseInt(attr.popoverDelay || 400) / 5)},
                        container: 'body'
                    });
                }
                buildPopover();

                // ui-grid doesn't destroy / recreate elements, it reuses them.  This methodology of reusing elements causes the
                //   popovers to not get updated.  This function will monitor the data and then re-create based on new data.
                attr.$observe('tdaPopover', function(newContent) {
                    $(elem).popover('destroy');
                    buildPopover();
                });

                scope.$on('$destroy', function() {
                    $(elem).popover('hide');
                    $(elem).popover('destroy');
                    $('body > .popover').remove(); // Because `.popover('destroy')` doesn't appear to remove it from the DOM
                });
            }
        };
    }
})();

(function() {
    'use strict';

    angular.module('theDivisionAgent.map')
        .directive('leaflet', MapDirective);

    MapDirective.$inject = ['$rootScope', '$stateParams', '$timeout', 'localStorageService'];
    function MapDirective($rootScope, $stateParams, $timeout, localStorageService){
        return {
            restrict: 'E',
            replace: true,
            template: '<div></div>',
            link: function(scope, elem, attrs){
                fixUserLastCenter(); // if the users last location was far out of bounds, reset to edge of map

                var DEBUG_MODE = false || $stateParams.debug;
                var MAX_ZOOM = 4;
                var MIN_ZOOM = 2;
                var ICON_SIZE = 32;
                var STARTING_LAT = ($stateParams.center && +$stateParams.center[0]) || localStorageService.get('map-last-lat') || -60;
                var STARTING_LNG = ($stateParams.center && +$stateParams.center[1]) || localStorageService.get('map-last-lng') || 40;
                var current_zoom = $stateParams.zoom || localStorageService.get('map-zoom') || 3;
                var icon_scale = localStorageService.get('map-icon-scale') || 1;
                var Icons = {};
                var Markers = {};

                // Create Map
                var theDivisionMap = L.map(attrs.id, {
                    center: [STARTING_LAT, STARTING_LNG],
                    zoom: current_zoom,
                    zoomControl: false,
                    maxZoom: MAX_ZOOM,
                    minZoom: MIN_ZOOM,
                }); // Default

                // Add Mouse Position to bottom left of map
                L.control.mousePosition().addTo(theDivisionMap);

                // Define custom map
                // L.tileLayer('/img/map/{z}/{x}/{y}.jpg', {
                L.tileLayer('/img/map_v2/{z}/{x}/{y}.png', {
                    attribution: '',
                    noWrap: true,
                    reuseTiles: true
                }).addTo(theDivisionMap);

                // Build Icons
                buildIcons();

                // Build Markers
                buildMarkers();

                // Loop over all our markers and place them on the map
                _.each(Markers, function(marker){
                    var icon = _.get(Icons, marker.type);
                    _.each(marker.locations, function(loc){
                        loc.marker = L.marker([loc.lat, loc.long], {icon: icon});
                        buildMarkerLabel(marker, loc);
                        if(DEBUG_MODE) {
                            loc.label = "("+loc.id+"): "+loc.label;
                        }
                        if(loc.label !== "") {
                            loc.marker.bindPopup(loc.label);
                            loc.marker.on('mouseover', function (e) {
                                this.openPopup();
                            });
                            loc.marker.on('mouseout', function (e) {
                                this.closePopup();
                            });
                        }
                        loc.marker.on('click', function(e){
                            mapPointClicked(e);
                            markerClicked(e, marker, loc);
                        });
                        if( localStorageService.get('map-filter-'+marker.type.toLowerCase()) !== false ) {
                            loc.marker.addTo(theDivisionMap);
                        }
                    });
                });

                function buildMarkerLabel(marker, location){
                    if( !location.label ) {
                        if( marker.type == "NamedBosses" ) {
                            location.label = "<b>"+(location.subway ? "(Subway) " : "")+"Named Bosses:</b><br/>" + location.bosses.join("<br/>");
                        }
                    }
                }

                //
                // Filter Markers
                //

                scope.$on('map-switch-filter', function(e, markerType, enabled){
                    _.each(_.find(Markers, {type: markerType}).locations, function(loc){
                        if(enabled)
                            loc.marker.addTo(theDivisionMap);
                        else
                            theDivisionMap.removeLayer(loc.marker);
                    });
                });

                //
                // Map Pathing
                //

                var enabledPathing = false;
                var pathArray = [];
                var pathPolygons = [];

                scope.$on('map-pathing', function(e, enabled){
                    enabledPathing = enabled;
                    if(enabled){
                        _.each(pathPolygons, function(poly){
                            theDivisionMap.removeLayer(poly);
                        });
                        pathArray = [];
                        pathPolygons = [];
                    }
                });

                scope.$on('map-pathing-undo', function(){
                    pathArray.pop();
                    scope.$emit('map-pathing-update', pathArray);

                    var lastPolygon = pathPolygons[pathPolygons.length - 1];
                    theDivisionMap.removeLayer(lastPolygon);
                    pathPolygons.pop();
                });

                // attaching function on map click
                theDivisionMap.on('click', mapPointClicked);

                function mapPointClicked(e){
                    if(enabledPathing){
                        var lat = e.latlng.lat.toFixed(1);
                        var lng = e.latlng.lng.toFixed(1);
                        plotPolyLine(lat, lng);
                    }
                }

                function plotPolyLine(lat, lng){
                    var lastPoint = pathArray.length > 0 ? pathArray[pathArray.length-1] : null;
                    if( lastPoint === null || !(lastPoint[0] === lat && lastPoint[1] === lng) ){
                        pathArray.push([lat,lng]);
                        scope.$emit('map-pathing-update', pathArray);

                        if(lastPoint === null){
                            lastPoint = [lat,lng];
                        }

                        var pointA = new L.LatLng(lastPoint[0], lastPoint[1]); // Last Point
                        var pointB = new L.LatLng(lat, lng); // New Point
                        var polyline = new L.Polyline([pointA, pointB], {
                            color: '#39FF14',
                            weight: 5,
                            opacity: 0.7,
                            smoothFactor: 1
                        });
                        polyline.addTo(theDivisionMap);
                        pathPolygons.push(polyline);
                    }
                }

                scope.$on('map-pathing-init', function(e, pointArray){
                    _.each(pointArray, function(point){
                        plotPolyLine(point[0], point[1]);
                    });
                });

                //
                // Custom Map Zoom
                //

                scope.$on('map-increase-zoom-level', function(e, callback){
                    if( current_zoom < MAX_ZOOM ) {
                        current_zoom = current_zoom + 1;
                        theDivisionMap.setZoom(current_zoom);
                        callback(e, current_zoom === MIN_ZOOM, current_zoom === MAX_ZOOM);
                    }
                });

                scope.$on('map-decrease-zoom-level', function(e, callback){
                    if( current_zoom > MIN_ZOOM ) {
                        current_zoom = current_zoom - 1;
                        theDivisionMap.setZoom(current_zoom);
                        callback(e, current_zoom === MIN_ZOOM, current_zoom === MAX_ZOOM);
                    }
                });

                theDivisionMap.on('zoomend', function(e){
                    current_zoom = e.target._zoom;
                    localStorageService.set('map-zoom', current_zoom);
                    scope.$emit('map-zoom-changed', current_zoom === MIN_ZOOM, current_zoom === MAX_ZOOM);
                });

                theDivisionMap.on('moveend', function(e){
                    var center = theDivisionMap.getCenter();
                    localStorageService.set('map-last-lat', center.lat);
                    localStorageService.set('map-last-lng', center.lng);
                });

                //
                // Icon Size Change
                //

                scope.$on('map-marker-size', function(e, scale){
                    icon_scale = scale;
                    localStorageService.set('map-icon-scale', icon_scale);
                    buildIcons();
                    _.each(Markers, function(marker){
                        var icon = _.get(Icons, marker.type);
                        _.each(marker.locations, function(loc){
                            if(loc.marker) {
                                loc.marker.setIcon(icon);
                            }
                        });
                    });
                });

                function fixUserLastCenter(){
                    var lat = localStorageService.get('map-last-lat') || -60;
                    var lng = localStorageService.get('map-last-lng') || 40;
                    if(lat < -90)
                        localStorageService.set('map-last-lat', -70);
                    if(lat > 90)
                        localStorageService.set('map-last-lat', 70);
                    if(lng < -180)
                        localStorageService.set('map-last-lng', -140);
                    if(lng > 180)
                        localStorageService.set('map-last-lng', 140);
                }

                //
                // Timers
                //

                var timerEnabled = false;

                scope.$on('map-timer-toggle', function(e, state){
                    timerEnabled = state;
                });

                function markerClicked(e, marker, loc){
                    if(timerEnabled && (loc.respawn || loc.link)){
                        if(loc.link){
                            var found = false;
                            _.each(Markers, function(m){
                                _.each(m.locations, function(l){
                                    if(!found && loc.link == l.id){
                                        loc = l;
                                        marker = m;
                                        found = true;
                                    }
                                });
                            });
                        }
                        scope.$emit('map-timer-start', marker, loc);
                    }
                }

                scope.$on('map-marker-center', function(e, marker){
                    theDivisionMap.setView(new L.LatLng(marker.lat, marker.long));
                });

                scope.$on('map-marker-pulse', function(e, marker){
                    var pulse = L.marker([marker.lat, marker.long], {icon: Icons.Pulse});
                    pulse.addTo(theDivisionMap);
                    $timeout(function(){
                        theDivisionMap.removeLayer(pulse);
                    }, 10000);
                });


                //
                // Special Icons
                //

                function buildIcons() {
                    var scaled_icon_size = ICON_SIZE * icon_scale;
                    var DivisionIcon = L.Icon.extend({
                        options: {
                            iconSize:     [scaled_icon_size, scaled_icon_size],
                            iconAnchor:   [(scaled_icon_size/2), (scaled_icon_size/2)],
                            popupAnchor:  [0, (0-scaled_icon_size)]
                        }
                    });

                    Icons = {
                        'Extractions':       new DivisionIcon({iconUrl: '/img/icons/extraction.svg'}),
                        'SubwayEntrances':   new DivisionIcon({iconUrl: '/img/icons/subway.svg'}),
                        'Landmarks':         new DivisionIcon({iconUrl: '/img/icons/landmark-off.svg'}),
                        'SafeHouses':        new DivisionIcon({iconUrl: '/img/icons/saferoom.svg'}),
                        'Checkpoints':       new DivisionIcon({iconUrl: '/img/icons/checkpoint.svg'}),
                        'DZEntrances':       new DivisionIcon({iconUrl: '/img/icons/dz-enterance.svg'}),
                        'ContaminatedZone':  new DivisionIcon({iconUrl: '/img/icons/containment-zone.svg'}),
                        'DivisionTech':      new DivisionIcon({iconUrl: '/img/icons/division-tech.svg'}),
                        'DarkZoneChests':    new DivisionIcon({iconUrl: '/img/icons/darkzone-chest.svg'}),
                        'NamedBosses':       new DivisionIcon({iconUrl: '/img/icons/enemy-named.svg'}),
                        'DZRank30Chests':    new DivisionIcon({iconUrl: '/img/icons/dz-rank30-chest.svg'}),
                    };

                    Icons.Pulse = L.divIcon({
                        className: 'css-icon',
                        html: '<div class="leaflet-marker-pulse"></div>',
                        iconSize: [64,64],
                        iconAnchor:   [32, 32],
                        popupAnchor:  [0, -32]
                    });
                }

                //
                // Markers
                //

                function buildMarkers() {
                    Markers = [
                        { type: "Checkpoints", typeFriendly: "Checkpoint", locations: [
                            { id: 1,    lat: -78.32,  long: 32.20,   label: "DZ01 South Checkpoint"},
                            { id: 2,    lat: -75.95,  long: 82.70,   label: "DZ01 East Checkpoint"},
                            { id: 3,    lat: -75.75,  long: -17.50,  label: "DZ01 West Checkpoint"},
                            { id: 4,    lat: -62.10,  long: 82.10,   label: "DZ02 East Checkpoint"},
                            { id: 5,    lat: -61.90,  long: -15.20,  label: "DZ02 West Checkpoint"},
                            { id: 6,    lat: 1.9,     long: -53,     label: "DZ03 Northwest Entrance"},
                            { id: 7,    lat: 1.9,     long: 67.5,    label: "DZ03 Northeast Entrance"},
                            { id: 8,    lat: -25.7,   long: 81.5,    label: "DZ03 Southeast Entrance"},
                            { id: 9,    lat: -36.80,  long: -40.00,  label: "DZ03 Southwest Checkpoint"},
                            { id: 10,   lat: 67.7,    long: -80,     label: "DZ06 West Checkpoint"},
                            { id: 11,   lat: 67.6,    long: 28.6,    label: "DZ06 East Checkpoint"},
                            { id: 12,   lat: 38,      long: 28.2,    label: "DZ05 East Checkpoint"},
                            { id: 13,   lat: 38.8,    long: -65.3,   label: "DZ05 West Checkpoint"},
                        ]},
                        { type: "DZEntrances", typeFriendly: "Entrance", locations: [
                            { id: 14,   lat: -47.00,  long: 82.10,   label: "DZ02 East Entrance"},
                            { id: 15,   lat: -54.60,  long: -19.00,  label: "DZ02 West Entrance"},
                            { id: 16,   lat: -25.6,   long: -47,     label: "DZ03 West Entrance"},
                            { id: 17,   lat: 28,      long: -60.8,   label: "DZ03 West Entrance"},
                            { id: 18,   lat: -13.3,   long: 81.5,    label: "DZ03 East Entrance"},
                            { id: 19,   lat: 28,      long: -60.8,   label: "DZ04 West Entrance"},
                            { id: 20,   lat: 59,      long: 28.4,    label: "DZ05 East Entrance"},
                        ]},
                        { type: "Landmarks", typeFriendly: "Landmark", locations: [
                            { id: 21,   lat: -72.30,  long: 28.00,                 label: "Koreatown"},
                            { id: 22,   lat: -65.10,  long: 32.20,   link: 158,    label: "Blockade"},
                            { id: 23,   lat: -66.25,  long: 54.00,                 label: "Abandoned Gas Station"},
                            { id: 24,   lat: -58.70,  long: 48.00,   link: 159,    label: "Construction Site"},
                            { id: 25,   lat: -41.80,  long: 25.30,   link: 161,    label: "Kalkesse Sporting Store"},
                            { id: 26,   lat: -41.80,  long: 67.00,   link: 162,    label: "The Library"},
                            { id: 27,   lat: -13.40,  long: 32.10,   link: 151,    label: "Refueling Station"},
/**/                        { id: 28,   lat: 8.80,    long: -6.0,    respawn: 300, label: "Arch Plaza"},
                            { id: 29,   lat: 38.5,    long: -41,                   label: "News Chopper Crash"},
                            { id: 30,   lat: 42,      long: -23,                   label: "Scaffolding Collapse"},
                            { id: 31,   lat: 59,      long: 15.0,    link: 166,    label: "The Pit"},
                            { id: 32,   lat: 64.1,    long: -16,     link: 167,    label: "Mid Town Music"},
                            { id: 33,   lat: 70,      long: 6.5,     link: 169,    label: "Q Building"},
                        ]},
                        { type: "Extractions", typeFriendly: "Extraction", locations: [
                            { id: 34,   lat: -70.00,  long: 65.00,  label: "Gas Station Extraction"},
                            { id: 35,   lat: -72.30,  long: -9.50,  label: "Subway Extraction"},
                            { id: 36,   lat: -51.60,  long: 12.10,  label: "Garage Rooftop Extraction"},
                            { id: 37,   lat: -12.80,  long: -6.6,   label: "Bryant Park Extraction"},
                            { id: 38,   lat: 33,      long: 52.4,   label: "Garage Rooftop Extraction"},
                            { id: 39,   lat: 43.3,    long: -5.4,   label: "Street Extraction"},
                            { id: 40,   lat: 52.4,    long: -52,    label: "Rooftop Extraction"},
                            { id: 41,   lat: 69.2,    long: -27.5,  label: "Hotel Rooftop Extraction"},
                        ]},
                        { type: "SafeHouses", typeFriendly: "Safe House", locations: [
                            { id: 42,   lat: -45.50,  long: 50.00,  label: "DZ02 Safe Room"},
                            { id: 43,   lat: -35.20,  long: -4.20,  label: "DZ03 Safe Room"},
                            { id: 44,   lat: 25.9,    long: -1.70,  label: "DZ04 Safe Room"},
                            { id: 45,   lat: 54.6,    long: -5.4,   label: "DZ05 Safe Room"},
                            { id: 46,   lat: 72.7,    long: -8,     label: "DZ06 Safe Room"},
                        ]},
                        { type: "DivisionTech", locations: [
                            { id: 47,   lat: -63,     long: 34,     respawn: 7200, name: "Div Tech: Blockade",            label: "In the corner on top of the scaffolding"},
                            { id: 48,   lat: -60.3,   long: 49.6,   respawn: 7200, name: "Div Tech: S. Construction (1)", label: "Second Floor: Southeast corner of building"},
                            { id: 49,   lat: -57.0,   long: 49.6,   respawn: 7200, name: "Div Tech: S. Construction (2)", label: "Second Floor: Northeast corner of building"},
                            { id: 50,   lat: -58.7,   long: 49.6,   respawn: 7200, name: "Div Tech: S. Construction (3)", label: "Third Floor: Middle of the building"},
                            { id: 51,   lat: -53.5,   long: 77.0,   respawn: 7200, name: "Div Tech: Laundromat (1)",      label: "Right of south entrance"},
                            { id: 52,   lat: -51.5,   long: 77.0,   respawn: 7200, name: "Div Tech: Laundromat (3)",      label: "Left room from the south entrance"},
                            { id: 53,   lat: -53.5,   long: 74.0,   respawn: 7200, name: "Div Tech: Laundromat (2)",      label: "Back right room from south entrance"},
                            { id: 54,   lat: -41.0,   long: 63.0,   respawn: 7200, name: "Div Tech: Library",             label: "Back left corner of boss area"},
                            { id: 55,   lat: -39.0,   long: 28,     respawn: 7200, name: "Div Tech: Sports Store (3)",    label: "Third Floor: Behind the christmas tree"},
                            { id: 56,   lat: -44.3,   long: 28,     respawn: 7200, name: "Div Tech: Sports Store (2)",    label: "Second Floor: Corner of building by the pool tables"},
                            { id: 57,   lat: -44.7,   long: 20,     respawn: 7200, name: "Div Tech: Sports Store (4)",    label: "Third Floor: Outside on scaffolding"},
                            { id: 58,   lat: -43.3,   long: 23,     respawn: 7200, name: "Div Tech: Sports Store (1)",    label: "First Floor"},
                            { id: 59,   lat: -30,     long: 12.5,   respawn: 7200, name: "Div Tech: Christmas Alley",     label: "South east corner of alley"},
                            { id: 60,   lat: -30,     long: 2,      respawn: 7200, name: "Div Tech: Roof DZ03 S.House",   label: "On top of the building behind a fence"},
                            { id: 61,   lat: -24,     long: 50,     respawn: 7200, name: "Div Tech: DZ03 Containment ",   label: "In containment zone north side of street"},
                            { id: 62,   lat: -13.4,   long: 30.5,   respawn: 7200, name: "Div Tech: Refueling Station",   label: "Middle of the area as you walk up the steps"},
                            { id: 63,   lat: -6,      long: 6.5,    respawn: 7200, name: "Div Tech: Bryant Park",         label: "Second Floor: Northeast corner of buildings"},
                            { id: 64,   lat: 8.80,    long: -3.6,   respawn: 7200, name: "Div Tech: Arch Plaza",          label: "Middle of building down one of the main hallways"},
                            { id: 65,   lat: 8.80,    long: -50,    respawn: 7200, name: "Div Tech: W 43rd Alley",        label: "End of Alley"},
                            { id: 66,   lat: 15.3,    long: -57,    respawn: 7200, name: "Div Tech: W 43rd Road End",     label: "End of street behind the truck"},
                            { id: 67,   lat: 9.5,     long: 53.6,   respawn: 7200, name: "Div Tech: DZ03 DT Bldg (2)",    label: "In the backroom behind the desks"},
                            { id: 68,   lat: 6.5,     long: 53.6,   respawn: 7200, name: "Div Tech: DZ03 DT Bldg (1)",    label: "Directly as you walk in from the south entrance"},
                            { id: 69,   lat: 13.5,    long: 68.6,   respawn: 7200, name: "Div Tech: E 43rd Road End",     label: "End of street on the south side"},
                            { id: 70,   lat: 19.6,    long: 16,     respawn: 7200, name: "Div Tech: Sniper Poach",        label: "Left side of the truck in the middle"},
                            { id: 71,   lat: 29.5,    long: 28,     respawn: 7200, name: "Div Tech: DZ04 DT Bldg (3)",    label: "Second Floor: By a desk in southeast corner"},
                            { id: 72,   lat: 31,      long: 29,     respawn: 7200, name: "Div Tech: DZ04 DT Bldg (4)",    label: "Second Floor: In the server room"},
                            { id: 73,   lat: 32.5,    long: 28,     respawn: 7200, name: "Div Tech: DZ04 DT Bldg (2)",    label: "Frist Floor: Back hallway near the northwest side"},
                            { id: 74,   lat: 32.5,    long: 25,     respawn: 7200, name: "Div Tech: DZ04 DT Bldg (1)",    label: "First Floor: Northwest corner room"},
                            { id: 75,   lat: 34.5,    long: 34,     respawn: 7200, name: "Div Tech: 5th Ave Shipping",    label: "Northeast corner of the street by shipping containers"},
                            { id: 76,   lat: 44.9,    long: 15.8,   respawn: 7200, name: "Div Tech: DZ05 DT Bldg",        label: "Middle of building slightly left of entrance"},
                            { id: 77,   lat: 50,      long: 9.9,    respawn: 7200, name: "Div Tech: S. Rockefeller Pl",   label: "Near subway entrance on west side of street"},
                            { id: 78,   lat: 44.5,    long: 0.5,    respawn: 7200, name: "Div Tech: DZ05 Extract N Bldg", label: "Second Floor: West side of north building"},
                            { id: 79,   lat: 42,      long: -2,     respawn: 7200, name: "Div Tech: DZ05 Extract S Bldg", label: "Second Floor: West side of south building"},
                            { id: 80,   lat: 37.5,    long: -41,    respawn: 7200, name: "Div Tech: News Chopper Crash",  label: "Next to crashed helicopter"},
                            { id: 81,   lat: 43.5,    long: -35,    respawn: 7200, name: "Div Tech: News Chopper Alley",  label: "In alleyway on the east side near the building"},
                            { id: 82,   lat: 48,      long: -62,    respawn: 7200, name: "Div Tech: W 47th Road End",     label: "End of the street on the southwest corner"},
                            { id: 83,   lat: 53,      long: -42,    respawn: 7200, name: "Div Tech: W 49th Alley",        label: "In alleyway on the east side near the building"},
                            { id: 84,   lat: 57,      long: -42,    respawn: 7200, name: "Div Tech: W 49th Road",         label: "Northwest corner of the sidewalk near building"},
                            { id: 85,   lat: 65.5,    long: -66.5,  respawn: 7200, name: "Div Tech: North Cleaners",      label: "In the tent on the south side"},
                            { id: 86,   lat: 71,      long: -66.5,  respawn: 7200, name: "Div Tech: 7th Ave (S)",         label: "In a small side alley east of the street"},
                            { id: 87,   lat: 73,      long: -66.5,  respawn: 7200, name: "Div Tech: 7th Ave (N)",         label: "In a small side alley east of the street"},
                            { id: 88,   lat: -74.8,   long: 54,     respawn: 7200, name: "Div Tech: South Parking Lot",   label: "Southeast corner of parking lot behind cars"},
                            { id: 89,   lat: -70.3,   long: -15.2,  respawn: 7200, name: "Div Tech: Greeley Park",        label: "Northeast edge of park, along the benchs"},
                            { id: 90,   lat: 50.5,    long: -31.1,  respawn: 7200, name: "Div Tech: DZ05 Central Bldg",   label: "South side of building"},
                            { id: 91,   lat: 55,      long: 3.8,    respawn: 7200, name: "Div Tech: DZ05 Safe House",     label: "South side of the street on the sidewalk"},
                            { id: 92,   lat: 59.2,    long: 20.3,   respawn: 7200, name: "Div Tech: The Pit",             label: "Top of the stairs behind the planter"},
                            { id: 93,   lat: -13.6,   long: 79.4,   respawn: 7200, name: "Div Tech: E 41st Road End",     label: "Middle of street inside the fencing"},
                            { id: 94,   lat: 70,      long: -7,     respawn: 7200, name: "Div Tech: DZ06 Safe House",     label: "In the alleyway just south of saferoom"},
                            { id: 95,   lat: 70,      long: -25.3,  respawn: 7200, name: "Div Tech: DZ06 Extract (1)",    label: "Outside building on the northeast corner"},
                            { id: 96,   lat: 69.6,    long: -27.6,  respawn: 7200, name: "Div Tech: DZ06 Extract (4)",    label: "Rooftop: Just north of the elevator shaft"},
                            { id: 97,   lat: 70,      long: -29.4,  respawn: 7200, name: "Div Tech: DZ06 Extract (3)",    label: "First Floor: Northwest corner of building behind elevator"},
                            { id: 98,   lat: 68.3,    long: -27.6,  respawn: 7200, name: "Div Tech: DZ06 Extract (2)",    label: "First Floor: Southeast corner of building just left of entrance"},
                            { id: 99,   lat: 74.4,    long: -39.1,  respawn: 7200, name: "Div Tech: W 55th Fencing",      label: "Back of alley behind fencing"},
                            { id: 100,  lat: 73.4,    long: -48.5,  respawn: 7200, name: "Div Tech: W 55th Tent",         label: "Back of tent"},
                            { id: 101,  lat: 70.3,    long: -53.2,  respawn: 7200, name: "Div Tech: W 55th - S. Alley",   label: "Middle of alleyway on the west side"},
                            { id: 102,  lat: 65.0,    long: 10.1,   respawn: 7200, name: "Div Tech: N. Rockefeller Pl",   label: "West side of the street on the sidewalk"},
                            { id: 103,  lat: 57.4,    long: -12.1,  respawn: 7200, name: "Div Tech: Underground Mall",    label: "In Subway"},
                        ]},
                        { type: "DarkZoneChests", locations: [
                            { id: 104,  lat: -78.2,   long: 52.7,   respawn: 3600, name: "DZ Chest: South Spawn",        label: "End of Alley"},
                            { id: 105,  lat: -65.15,  long: 29.6,   respawn: 3600, name: "DZ Chest: Blockade",           label: "Middle of blockade against building"},
                            { id: 106,  lat: -59.75,  long: 47.9,   respawn: 3600, name: "DZ Chest: South Construction", label: "Middle of Building on 1st Floor"},
                            { id: 107,  lat: -43,     long: 25.2,   respawn: 3600, name: "DZ Chest: Sports Store",       label: "Middle of Building on 2nd Floor"},
                            { id: 108,  lat: -42,     long: 63,     respawn: 3600, name: "DZ Chest: Library",            label: "Middle of area against building"},
                            { id: 109,  lat: -69.2,   long: -10.8,  respawn: 3600, name: "DZ Chest: South Subway (1)",   label: "Against Wall in Subway"},
                            { id: 110,  lat: -63.1,   long: -6.7,   respawn: 3600, name: "DZ Chest: South Subway (2)",   label: "Back of Subway"},
                            { id: 111,  lat: -46.6,   long: -29.5,  respawn: 3600, name: "DZ Chest: South Cleaners",     label: "End of Road"},
                            { id: 112,  lat: 18.9,    long: 18,     respawn: 3600, name: "DZ Chest: Sniper Poach",       label: "Back of truck"},
                            { id: 113,  lat: -12.8,   long: -1.8,   respawn: 3600, name: "DZ Chest: Bryant Park",        label: "Middle of extraction near the helipad"},
                            { id: 114,  lat: 27.9,    long: 68.6,   respawn: 3600, name: "DZ Chest: East Cleaners",      label: "End of Road"},
                            { id: 115,  lat: -6,      long: 12.5,   respawn: 3600, name: "DZ Chest: East Park Subway",   label: "In Subway"},
                            { id: 116,  lat: -13.25,  long: -22.4,  respawn: 3600, name: "DZ Chest: West Park Subway",   label: "In Subway"},
                            { id: 117,  lat: 58.95,   long: 13.2,   respawn: 3600, name: "DZ Chest: The Pit",            label: "Middle of the pit against the west wall"},
                            { id: 118,  lat: 68.5,    long: 2.5,    respawn: 3600, name: "DZ Chest: Q Building",         label: "Second floor just south of escalator"},
                            { id: 119,  lat: 59,      long: -70,    respawn: 3600, name: "DZ Chest: North Cleaners",     label: "In a tent, back of truck"},
                            { id: 120,  lat: 64,      long: -20.3,  respawn: 3600, name: "DZ Chest: Mid Town Music",     label: "On west sidewalk near the wall of Mid Town Music"},
                            { id: 121,  lat: 72.4,    long: -49.6,  respawn: 3600, name: "DZ Chest: DZ06 Subway (1)",    label: "Subway behind stairs"},
                            { id: 122,  lat: 33.6,    long: -52.0,  respawn: 3600, name: "DZ Chest: North Construction", label: "Rooftop"},
                            { id: 171,  lat: -9.2,    long: -2.0,   respawn: 3600, name: "DZ Chest: Mid Park Subway",    label: "Small Room in Subway"},
                            { id: 172,  lat: 49.6,    long: -28,    respawn: 3600, name: "DZ Chest: DZ05 Subway",        label: "Back of Subway"},
                            { id: 173,  lat: 72.7,    long: -44.4,  respawn: 3600, name: "DZ Chest: DZ06 Subway (2)",    label: "Back of Subway"},
                            { id: 174,  lat: 73.6,    long: -55.2,  respawn: 3600, name: "DZ Chest: DZ06 Subway (3)",    label: "Machine Room in Subway"},
                        ]},
                        { type: "SubwayEntrances", typeFriendly: "Subway", locations: [
                            { id: 123,  lat: 68.5,    long: -68.5,  label: "<b>7th Ave station</b>"},
                            { id: 124,  lat: 72.6,    long: -65,    label: "<b>7th Ave station</b>"},
                            { id: 125,  lat: 71.7,    long: -65.8,  label: "<b>7th Ave station</b>"},
                            { id: 126,  lat: 71.66,   long: -42.5,  label: "<b>7th Ave station</b>"},
                            { id: 127,  lat: 61,      long: -26,    label: "<b>Concourse West entrance</b><br/>Access to 47-50th St Rockefeller Center station"},
                            { id: 128,  lat: 56.5,    long: -27,    label: "<b>Concourse West entrance</b><br/>Access to 47-50th St Rockefeller Center station"},
                            { id: 129,  lat: 55.2,    long:-17.1,   label: "<b>Concourse South entrance</b><br/>Access to 47-50th St Rockefeller Center station"},
                            { id: 130,  lat: 60,      long: 8.8,    label: "<b>Concourse East entrance</b><br/>Access to 47-50th St Rockefeller Center station"},
                            { id: 131,  lat: 58,      long: 8.8,    label: "<b>Concourse East entrance</b><br/>Access to 47-50th St Rockefeller Center station"},
                            { id: 132,  lat: 52,      long: 8.8,    label: "<b>Concourse East entrance</b><br/>Access to 47-50th St Rockefeller Center station"},
                            { id: 133,  lat: 60,      long: 12.5,   label: "<b>Concourse East entrance</b><br/>In the Pit<br/>Access to 47-50th St Rockefeller Center station"},
                            { id: 134,  lat: 58,      long: 12.5,   label: "<b>Concourse East entrance</b><br/>In the Pit<br/>Access to 47-50th St Rockefeller Center station"},
                            { id: 135,  lat: 54.25,   long: -26.7,  label: "<b>47-50th St Rockefeller Center station</b><br/>Access to Concourse"},
                            { id: 136,  lat: 47,      long: -28.2,  label: "<b>47-50th St Rockefeller Center station</b><br/>Access to Concourse"},
                            { id: 137,  lat: 45,      long: -21.2,  label: "<b>47-50th St Rockefeller Center station</b><br/>Access to Concourse"},
                            { id: 138,  lat: -2.5,    long: 23,     label: "<b>Public Library station</b><br/>Access to Bryant Park station"},
                            { id: 139,  lat: -1.8,    long: -1.8,   label: "<b>Public Library station</b><br/>Access to Bryant Park station"},
                            { id: 140,  lat: -1.8,    long: -17.5,  label: "<b>Bryant Park station</b><br/>Access to Public Library station"},
                            { id: 141,  lat: -1.8,    long: -32.5,  label: "<b>Bryant Park station</b><br/>Access to Public Library station"},
                            { id: 142,  lat: -11.5,   long: -38.5,  label: "<b>Bryant Park station</b><br/>Access to Public Library station"},
                            { id: 143,  lat: -23.6,   long: -28.2,  label: "<b>Bryant Park station</b><br/>Access to Public Library station"},
                            { id: 144,  lat: -23.6,   long: -17.2,  label: "<b>Bryant Park station</b><br/>Access to Public Library station"},
                            { id: 145,  lat: -60.9,   long: 3.3,    label: "<b>33rd St station"},
                            { id: 146,  lat: -63.0,   long: 2.1,    label: "<b>33rd St station"},
                            { id: 147,  lat: -71.5,   long: -20.2,  label: "<b>33rd St station"},
                            { id: 148,  lat: -71.8,   long: -14.9,  label: "<b>33rd St station"},
                            { id: 149,  lat: -75.0,   long: -6.6,   label: "<b>33rd St station"},
                        ]},
                        { type: "NamedBosses", typeFriendly: "Boss", locations: [
/* CONFIRMED */             { id: 150,  lat: 17.5,    long: 19,     respawn: 600, subway: false, name: "Sniper Poach",                     bosses: ["Boomerang", "Hawkeye"] },                     // W 43rd St parking
/* CONFIRMED */             { id: 151,  lat: -11.5,   long: 30.5,   respawn: 300, subway: false, name: "Refueling Station",                bosses: ["Animal", "Short Fuse"] },                     // Refueling Station
/* CONFIRMED */             { id: 152,  lat: -12.8,   long: -4,     respawn: 600, subway: false, name: "Bryant Park",                      bosses: ["Animal", "Torch"] },                          // Bryant Park
/* CONFIRMED */             { id: 153,  lat: -6,      long: 11,     respawn: 600, subway: true,  name: "Bryant Park Subway (East)",        bosses: ["Hundley", "McGrady", "O'Rourke"] },           // Public Library Station (Subway)
/* CONFIRMED */             { id: 154,  lat: 62.3,    long: -70.3,  respawn: 600, subway: false, name: "Northwest Cleaner Boss",           bosses: ["Barkley", "Claxton", "Draxler", "Hardaway", "Hundley", "McGrady", "O'Rourke"] }, // Containment zone next to DZ06 West Entrance
/* CONFIRMED */             { id: 155,  lat: 27.3,    long: 62,     respawn: 600, subway: false, name: "East Cleaner Boss",                bosses: ["Barkley", "Claxton", "Coveleski", "Draxler", "Greenberg", "Hardaway", "McGrady"] }, // Containment zone East 45th St
/* CONFIRMED */             { id: 156,  lat: -77,     long: 52.7,   respawn: 600, subway: false, name: "South Spawn",                      bosses: ["Bonnie", "Cowboy", "Dropkick"] },             // South Spawn (no landmark)
/* CONFIRMED */             { id: 157,  lat: -66.9,   long: -6.7,   respawn: 600, subway: true,  name: "Greeley Sq. Subway (DZ01)",        bosses: ["Claxton", "Hardaway"] },                      // 33rd St station
/* CONFIRMED */             { id: 158,  lat: -66.9,   long: 31.8,   respawn: 600, subway: false, name: "Blockade",                         bosses: ["Buckshot", "Dropkick", "Scrapper"] },         // Blockade
/* CONFIRMED */             { id: 159,  lat: -57.2,   long: 46.5,   respawn: 600, subway: false, name: "South Construction Site",          bosses: ["Animal", "Baz", "Hot Rod"] },                 // 34th St Construction Site
/* CONFIRMED */             { id: 160,  lat: -46.86,  long: -23,    respawn: 900, subway: false, name: "South Cleaner Boss",               bosses: ["Claxton", "Coveleski", "Greenberg", "Hundley", "Mazeroski", "O'Rourke"] },
/* CONFIRMED */             { id: 161,  lat: -41.7,   long: 27.9,   respawn: 600, subway: false, name: "Kalkesse Sporting Store",          bosses: ["Animal", "Zeke"] },                           // Kalkesse Sporting Store
/* CONFIRMED */             { id: 162,  lat: -42,     long: 60.8,   respawn: 600, subway: false, name: "The Library",                      bosses: ["Animal", "Boomerang", "Cannibal"] },          // The Library
/* CONFIRMED */             { id: 163,  lat: -13,     long: -25.3,  respawn: 600, subway: true,  name: "Bryant Park Subway (West)",        bosses: ["Draxler", "Mazeroski", "O'Rourke"] },         // Bryant Park Station (Subway) W
/*  */                      { id: 164,  lat: 30,      long: -50,    respawn: 600, subway: false, name: "West Construction Site",           bosses: ["Animal", "Greyhound", "Hot Rod"] },           // West 54th (West Construction Site)
/* CONFIRMED */             { id: 166,  lat: 59,      long: 17.5,   respawn: 600, subway: false, name: "The Pit",                          bosses: ["Cpl. Newhouser", "Cpt. Carter", "Cpt. Wilson", "Gambit", "Sgt. Morgan", "Sgt. Thompson"] }, // The Pit
/*  */                      { id: 167,  lat: 62.3,    long: -23,    respawn: 600, subway: false, name: "Mid Town Music",                   bosses: ["Cpt. Bryant", "Cpt. Rollins", "Gambit", "Shadow"] }, // Mid Town Music
/* CONFIRMED */             { id: 168,  lat: 72.15,   long: -59.3,  respawn: 600, subway: true,  name: "North Subway (DZ06)",              bosses: ["Coveleski", "Greenberg", "O'Rourke"] },       // 7th Ave Station (Subway)
/*  */                      { id: 169,  lat: 70.0,    long: 0,      respawn: 600, subway: false, name: "Q Building",                       bosses: ["Coveleski", "Mazeroski"] },                   // Q Building
/* CONFIRMED */             { id: 170,  lat: 45,      long: -28.2,  respawn: 600, subway: true,  name: "Rockefeller Subway (DZ05)",        bosses: ["Barkley", "O'Rourke"] },                      // 47-50th St Rockefeller Center station (Subway)
                        ]},
                        { type: "DZRank30Chests", locations: [
                            // { id: 175,  lat: 62.7,    long: -76.6,  label: "Behind the tent"},
                            // { id: 176,  lat: -74.4,   long: 20.7,   label: "Against left wall at end of contaminated zone"},
                            // { id: 177,  lat: -70.1,   long: 39.3,   label: "Against wall near truck"},
                            // { id: 178,  lat: -70,     long: 20.4,   label: "End of contaminated zone"},
                            // { id: 179,  lat: 34.5,    long: 59.5,   label: "End of the street in the tent"},
                            // { id: 180,  lat: 50.4,    long: -63.4,  label: "End of the street in the tent"},
                            // { id: 181,  lat: -59.1,   long: 72.4,   label: "Downstairs right side"},
                            // { id: 182,  lat: -65.2,   long: 43.4,   label: "Near ambulance"},
                            // { id: 183,  lat: -52.3,   long: -23,    label: "In tent"},
                            // { id: 184,  lat: -42.5,   long: 0.7,    label: "Against wall"},
                            // { id: 185,  lat: -31.4,   long: -14.4,  label: "End of alley"},
                            // { id: 186,  lat: -33,     long: 42.9,   label: "Against wall"},
                            // { id: 187,  lat: -27.1,   long: 48.6,   label: "Near forklift"},
                            // { id: 188,  lat: 26.6,    long: 69,     label: "End of Road"},
                            // { id: 189,  lat: 34.3,    long: 13.9,   label: "Against wall"},
                            // { id: 190,  lat: 20.9,    long: 3.9,    label: "Behind big forklift"},
                            // { id: 191,  lat: 44.5,    long: 9.9,    label: "Against wall"},
                            // { id: 192,  lat: 55.4,    long: 27.2,   label: "Right corner behind truck"},
                            // { id: 193,  lat: 62.5,    long: 25.5,   label: "Against tent"},
                            // { id: 194,  lat: 69.5,    long: 13,     label: "First Floor: Southeast corner room"},
                            // { id: 195,  lat: 72.2,    long: 26.2,   label: "On left truck"},
                            // { id: 196,  lat: 74.9,    long: 10.5,   label: "Left corner in shop"},
                            // { id: 197,  lat: 75,      long: -51.8,  label: "End of Alley"},
                            // { id: 198,  lat: 72.2,    long: -84.6,  label: "On truck"},
                            // { id: 199,  lat: 65.6,    long: -51.4,  label: "Against wall"},
                            // { id: 200,  lat: 59.4,    long: -52.8,  label: "Corner near WarrenGate building"},
                            // { id: 201,  lat: -64.5,   long: -2.8,   label: "On Rooftop"},
                            // { id: 202,  lat: -57.5,   long: -1.4,   label: "Against wall"},
                            // { id: 203,  lat: -50.2,   long: 21.6,   label: "Against wall"},
                        ]},
                        { type: "ContaminatedZone", locations: [
                            { id: 204,  lat: -74.7,   long: 21.45,  label: "Contamination level: 2"},
                            { id: 205,  lat: -70.9,   long: 20.5,   label: "Contamination level: 2"},
                            { id: 206,  lat: -70.3,   long: 40.7,   label: "Contamination level: 2"},
                            { id: 207,  lat: -66.9,   long: -5,     label: "<b>Subway:</b><br/>Contamination level: 4"},
                            { id: 208,  lat: -64.15,  long: -4.7,   label: "Contamination level: 3"},
                            { id: 209,  lat: -65.4,   long: 43.7,   label: "Contamination level: 2"},
                            { id: 210,  lat: -58.2,   long: -1.5,   label: "Contamination level: 2"},
                            { id: 211,  lat: -58.75,  long: 71.3,   label: "Contamination level: 2"},
                            { id: 212,  lat: -47.1,   long: -17.7,  label: "Contamination level: 3"},
                            { id: 213,  lat: -50.55,  long: 24.4,   label: "Contamination level: 2"},
                            { id: 214,  lat: -41.9,   long: 3.7,    label: "Contamination level: 2"},
                            { id: 215,  lat: -34,     long: 42.3,   label: "Contamination level: 3"},
                            { id: 216,  lat: -31.5,   long: -12.6,  label: "Contamination level: 3"},
                            { id: 217,  lat: -25.2,   long: 46.8,   label: "Contamination level: 3"},
                            { id: 218,  lat: -9.4,    long: -14,    label: "<b>Subway:</b><br/>Contamination level: 4"},
                            { id: 219,  lat: 19.5,    long: 4,      label: "Contamination level: 3"},
                            { id: 220,  lat: 27.3,    long: 59.5,   label: "Contamination level: 4"},
                            { id: 221,  lat: 33,      long: 13.45,  label: "Contamination level: 3"},
                            { id: 222,  lat: 43.2,    long: 13,     label: "Contamination level: 4"},
                            { id: 223,  lat: 43.2,    long: -28.2,  label: "<b>Subway:</b><br/>Contamination level: 4"},
                            { id: 224,  lat: 52.2,    long: -61.2,  label: "Contamination level: 4"},
                            { id: 225,  lat: 60.6,    long: -69.8,  label: "Contamination level: 4"},
                            { id: 226,  lat: 59.2,    long: -53.7,  label: "Contamination level: 4"},
                            { id: 227,  lat: 59,      long: -8,     label: "<b>Subway:</b><br/>Contamination level: 4"},
                            { id: 228,  lat: 55.8,    long: 23.7,   label: "Contamination level: 4"},
                            { id: 229,  lat: 62.15,   long: 23.7,   label: "Contamination level: 4"},
                            { id: 230,  lat: 65.2,    long: -50.9,  label: "Contamination level: 4"},
                            { id: 231,  lat: 72.3,    long: -79.7,  label: "Contamination level: 4"},
                            { id: 232,  lat: 72.5,    long: -54.6,  label: "<b>Subway:</b><br/>Contamination level: 4"},
                            { id: 233,  lat: 74.2,    long: -51.65, label: "Contamination level: 4"},
                            { id: 234,  lat: 70.5,    long: 11,     label: "Contamination level: 4"},
                        ]},
                        { type: "SupplyDrops", typeFriendly: "Supply Drop", locations: [
                            // { id: 235, lat: 0, long: 0, label: ""},
                        ]}
                    ];
                }
            }
        };
    }
}());


// ||===========================================================================||
// ||  [Boss Name]    || [Archtype]      || [Faction]  || [Confirmed HE Drops]  ||
// ||===========================================================================||
// ||  Animal         ||  Tank           ||  Riker     || Midas/ Gloves/ Strike pack/ Advanced Stamina Mod
// ||  Barkley        ||  Controller     ||  Cleaner   || Tactical pack
// ||  Baz            ||  Leader         ||  Riker     || Socom M1A
// ||  Bonnie         ||  Special        ||  Rioter    ||
// ||  Boomerang      ||  Sniper         ||  Riker     || Angled Grip
// ||  Buckshot       ||  Sniper         ||  Rioter    || Magazine
// ||  Cannibal       ||  Tank           ||  Riker     ||
// ||  Claxton        ||  Controller     ||  Cleaner   ||
// ||  Coveleski      ||  Sniper         ||  Cleaner   ||
// ||  Cowboy         ||                 ||  Rioter    ||
// ||  Cpl. Newhouser ||  Controller     ||  LMB       ||
// ||  Cpt. Bryant    ||  Tank           ||  LMB       ||
// ||  Cpt. Carter    ||  Leader         ||  LMB       ||
// ||  Cpt. Morgan    ||                 ||  LMB       ||
// ||  Cpt. Rollins   ||                 ||  LMB       ||
// ||  Cpt. Wilson    ||  Sniper         ||  LMB       ||
// ||  Draxler        ||  Controller     ||  Cleaner   ||
// ||  Dropkick       ||  Heavy Weapons  ||  Rioter    ||
// ||  Gambit         ||  Specialist     ||  LMB       || Spec-ops pads
// ||  Greenberg      ||  Thrower        ||  Cleaner   || Holster
// ||  Greyhound      ||                 ||  Riker     ||
// ||  Hardaway       ||  Tank           ||  Cleaner   ||
// ||  Hawkeye        ||  Sniper         ||  Riker     || Midas
// ||  Hot Rod        ||  Thrower        ||  Riker     || Magazine
// ||  Hundley        ||  Sniper         ||  Cleaner   || M1911/ Spec-ops pads/ Operator pads/ Prototype Performance Mod
// ||  Mazeroski      ||  Tank           ||  Cleaner   ||
// ||  McGrady        ||  Thrower        ||  Cleaner   ||
// ||  O'Rourke       ||  Tank           ||  Cleaner   ||
// ||  Scrapper       ||  Heavy Weapons  ||  Rioter    ||
// ||  Sgt. Thompson  ||  Heavy Weapons  ||  LMB       ||
// ||  Sgt. Morgan    ||                 ||  LMB       ||
// ||  Shadow         ||  Special        ||  LMB       ||
// ||  Short Fuse     ||  Leader         ||  Riker     || Prototype Performance Mod
// ||  Stojacovich    ||                 ||            ||
// ||  Torch          ||  Thrower        ||  Riker     || Spec-ops gloves/ Prototype Performance Mod
// ||  Zeke           ||  Tank           ||  Riker     ||
// ||===========================================================================||

(function() {
    'use strict';

    angular.module('theDivisionAgent.map')
        .filter('msToMinSec', msToMinSec);

    function msToMinSec() {
		return function(value) {
            function addZ(n) {
                return (n<10? '0':'') + n;
            }

            value = Math.floor(value / 1000);
            var secs = Math.floor(value % 60);
            value = (value - secs) / 60;
            var mins = Math.floor(value % 60);
            var hrs  = Math.floor((value - mins) / 60);

            return (hrs ? (hrs + ':' + addZ(mins)) : mins) + ':' + addZ(secs);
		};
	}
}());

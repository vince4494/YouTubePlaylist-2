var app = angular.module('PlaylistApp', []);

// Run

app.run(function () { //This code loads the IFrame Player API code asynchronously.
  var tag = document.createElement('script');
  tag.src = "http://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


});

// Service

app.service('VideosService', ['$window', '$rootScope', '$log','$http', function ($window, $rootScope, $log, $http) {

  var service = this;

  var youtube = { //object literal to maintain the properties of current YouTube Video
    ready: false,
    player: null,
    playerId: null,
    videoId: null,
    videoTitle: null,
    playerHeight: '480',
    playerWidth: '740',
    state: 'stopped',
    index: 0
  };
  var results = []; //stores the result of search
  var playlist = []; //stores the queued youtube videos

  $window.onYouTubeIframeAPIReady = function () {
    $log.info('Youtube API is ready');
    youtube.ready = true;
    service.bindPlayer('placeholder');
    service.loadPlayer();
    $rootScope.$apply();
  };

  function onYoutubeReady (event) {
    $log.info('YouTube Player is ready');
    youtube.player.cueVideoById(youtube.videoId);
  };

  function onYoutubeStateChange (event) {
    if (event.data == YT.PlayerState.PLAYING) {
      youtube.state = 'playing';
    } else if (event.data == YT.PlayerState.PAUSED) {
      youtube.state = 'paused';
    } else if (event.data == YT.PlayerState.ENDED) {
      youtube.state = 'ended';
      youtube.index = youtube.index + 1;
      service.launchPlayer(playlist[youtube.index].id, playlist[youtube.index].title);
    }
    $rootScope.$apply();
  }

  this.bindPlayer = function (elementId) {
    $log.info('Binding to ' + elementId);
    youtube.playerId = elementId;
  };

  this.createPlayer = function () {
    $log.info('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
    return new YT.Player(youtube.playerId, {
      height: youtube.playerHeight,
      width: youtube.playerWidth,
      playerVars: {
        rel: 0,
        showinfo: 0
      },
      events: {
        'onReady': onYoutubeReady,
        'onStateChange': onYoutubeStateChange
      }
    });
  };

  this.loadPlayer = function () {
    if (youtube.ready && youtube.playerId) {
      if (youtube.player) {
        youtube.player.destroy();
      }
      youtube.player = service.createPlayer();
    }
  };

  this.launchPlayer = function (id, title) {
    youtube.player.loadVideoById(id);
    youtube.videoId = id;
    youtube.videoTitle = title;
    for (i = 0; i < playlist.length; i++) {
      if (playlist[i].id == id) {
        youtube.index = i;
        break;
      }
    }
    return youtube;
  };

  this.listResults = function (data) {
    results.length = 0;
    for (var i = 0; i < data.items.length; i++) {
      results.push({
        id: data.items[i].id.videoId,
        title: data.items[i].snippet.title,
        description: data.items[i].snippet.description,
        thumbnail: data.items[i].snippet.thumbnails.default.url,
        author: data.items[i].snippet.channelTitle
      });
    }
    return results;
  };

  this.shufflePlaylist = function (list) {
    var j, x, i;
    for (i = list.length; i; i -= 1) {
      j = Math.floor(Math.random() * i);
      x = list[i - 1];
      list[i - 1] = list[j];
      list[j] = x;

    }
    youtube.index = -1;

  };

  this.queueVideo = function (id, title) {
    playlist.push({
      id: id,
      title: title
    });
    return playlist;
  };

  this.deleteVideo = function (list, id) {
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].id === id) {
        list.splice(i, 1);
        break;
      }
    }
  };

  this.setPlaylist = function (){
    return $http.get('http://localhost:8400/playlist')
        .success (function (data) {
          playlist = data;
        })
  };
    this.getYoutube = function () {
        return youtube;
    };

    this.getResults = function () {
        return results;
    };

    this.getPlaylist = function () {
        return playlist;
    };

}]);


// Controller

app.controller('VideosController', function ($scope, $http, $log, VideosService) {

    init();

    function init() {

      $scope.youtube = VideosService.getYoutube();
      $scope.results = VideosService.getResults();
      $scope.playlist = VideosService.getPlaylist();

      VideosService.setPlaylist().success(function (data){
        $scope.playlist = data;
      });
    }

    $scope.launch = function (id, title) {
      VideosService.launchPlayer(id, title);
      $log.info('Launched id:' + id + ' and title:' + title);
    };

    $scope.queue = function (id, title) {
      VideosService.queueVideo(id, title);
      $log.info('Queued id:' + id + ' and title:' + title);
    };

    $scope.shuffle = function()
    {
      var x;
      if (confirm("Are you sure you want to shuffle the playlist? Action cannot be undone!") == true) {
        VideosService.shufflePlaylist($scope.playlist);
      }
      else {
        x = "You pressed Cancel";
      }
    };

    $scope.delete = function (id) {
      VideosService.deleteVideo($scope.playlist, id);
    };

    $scope.clear = function() {
      var x;
      if (confirm("Are you sure you want to clear the playlist?") == true) {
        $scope.playlist.length = 0;
      }
      else {
        x = "You pressed Cancel";
      }
    };

    $scope.forward = function(id, title) {
      for (i = 0; i < $scope.playlist.length; i++) {
        if ($scope.playlist[i].id == id) {
          var nextId = $scope.playlist[i + 1].id;
          var nextTitle = $scope.playlist[i + 1].title;
          break;
        }
      }
      VideosService.launchPlayer(nextId, nextTitle);
    };

  $scope.backward = function(id, title) {
    for (i = 0; i < $scope.playlist.length; i++) {
      if ($scope.playlist[i].id == id) {
        var backId = $scope.playlist[i - 1].id;
        var backTitle = $scope.playlist[i - 1].title;
        break;
      }
    }
    VideosService.launchPlayer(backId, backTitle);
  };

    $scope.save = function(list){
        $http.put('http://localhost:8400/playlist', list);
        alert("You have saved your playlist");

    };

    $scope.search = function () {
      $http.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: 'AIzaSyCftoxadXTqUnCjiZXWxRyRi5zdAgAxZNw',
          type: 'video',
          maxResults: '20',
          part: 'id,snippet',
          fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
          q: this.query
        }
      })
      .success( function (data) {
        VideosService.listResults(data);
        localStorage['playlist.json'] = angular.toJson(data);
        $log.info(data);
      })
      .error( function () {
        $log.info('Search error');
      });
    }});


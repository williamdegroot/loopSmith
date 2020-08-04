
//get user media
function getUserMedia(options, successCallback, failureCallback) {
  var api = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia;
  if (api) {
    return api.bind(navigator)(options, successCallback, failureCallback);
  }
}

//stream

if (!navigator.getUserMedia && !navigator.webkitGetUserMedia &&
    !navigator.mozGetUserMedia && !navigator.msGetUserMedia) {
    alert('User Media API not supported.');
  }
  
var constraints = {video: true, audio: true};
getUserMedia(constraints, function (stream) {
  var mediaControl = document.querySelector('#videoElement');
    
  if ('srcObject' in mediaControl) {
      mediaControl.srcObject = stream;
  } else if (navigator.mozGetUserMedia) {
      mediaControl.mozSrcObject = stream;
  } else {
      mediaControl.src = (window.URL || window.webkitURL).createObjectURL(stream);
  }
    
  theStream = stream;

  try {
    var options = {mimeType: 'video/webm;codecs=h264'}; 
    recorder = new MediaRecorder(stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder: ' + e);
  }

  
  theRecorder = recorder;
}, function (err) {
  alert('Error: ' + err);
});

var vid = document.getElementById("videoElement");
vid.muted = true;

var theStream;
var theRecorder;
var recordedChunks = [];
var blob;
var url;

function getScreenShot() {
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var video = document.querySelector("#videoElement");
  context.drawImage(video, 0, 0, 640, 480);
}
function getStream() {
  console.log('MediaRecorder created');
  theRecorder.ondataavailable = recorderOnDataAvailable;
  theRecorder.start();
}


function makeLoop(){
 
  //setup stream and start recording
  getStream();
  //-----organize buttons
  //show directions
  var directions = document.querySelector('#directions');
  var button = document.querySelector('#record');
  
  //Give user some updates

  setTimeout(function () {
    directions.innerHTML = "Now recording..." ;
     //hide record button
    button.style.opacity = '0%';
    button.style.position = 'absolute';
    button.style.left = '-1000px'

    getScreenShot();

    setTimeout(function () {
      directions.innerHTML = "Almost there...";

      setTimeout(function () {
        directions.innerHTML = "Now match up your face with the screenshot and then click 'done'!";
        document.getElementById('canvas').style.opacity = '55%';
        document.getElementById('stop').style.opacity = '100%';
        document.getElementById('stop').style.position = "static";

      }, 4000); 
    }, 4000); 
  }, 20);
  
}


function recorderOnDataAvailable(event) {
  if (event.data.size == 0) return;
  recordedChunks.push(event.data);
}

function stopVideo() {
  console.log('Saving data');
  theRecorder.stop();
  theStream.getTracks()[0].stop();
  
  document.querySelector('#stop').style.opacity = '0%'
  document.querySelector('#stop').style.position = 'absolute'
  document.querySelector('#stop').style.left = '-1000px'
  document.querySelector('#download').style.opacity = '100%'
  document.querySelector('#download').style.position = "static"
  document.querySelector('#directions').innerHTML = 'You\'re done! Download the video below!'
  var video = document.querySelector('#videoElement')
  setTimeout(function () {
    prepVideo();
    //draw image onto canvas and flip back
    var c = document.querySelector('#canvas');
    var cnntx = c.getContext("2d");
    cnntx.clearRect(0, 0, canvas.width, canvas.height);
    c.style.transform = "translate(-50%,0)";
    
    const img = new Image();       
    img.src = './checkmark.png';       
    img.onload = () => {cnntx.drawImage(img, 0, 0);}; 
    c.style.opacity = "100%"

    //fade out video
    var video = document.querySelector('#videoElement')
    video.style.opacity = "20%"
    
  }, 100); 
  
}

function prepVideo(){
  blob = new Blob(recordedChunks, {type: "video/webm"});
  url = (window.URL || window.webkitURL).createObjectURL(blob);
}



function download() {
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = 'loop_by_loopSmith.webm';
  a.click();

  
  // setTimeout() here is needed for Firefox.
  setTimeout(function () {
      (window.URL || window.webkitURL).revokeObjectURL(url);
  }, 100); 
}

//CONVERSION STUFF -- FROM MRMUAZ
/*
var worker;
// var workerPath = location.href.replace(location.href.split('/').pop(), '') + 'ffmpeg_asm.js';
var workerPath = 'https://googledrive.com/host/0B6GWd_dUUTT8OEtLRGdQb2pibDg/ffmpeg_asm.js';

function processInWebWorker() {
    var blob = URL.createObjectURL(new Blob(['importScripts("' + workerPath + '");var now = Date.now;function print(text) {postMessage({"type" : "stdout","data" : text});};onmessage = function(event) {var message = event.data;if (message.type === "command") {var Module = {print: print,printErr: print,files: message.files || [],arguments: message.arguments || [],TOTAL_MEMORY: message.TOTAL_MEMORY || false};postMessage({"type" : "start","data" : Module.arguments.join(" ")});postMessage({"type" : "stdout","data" : "Received command: " +Module.arguments.join(" ") +((Module.TOTAL_MEMORY) ? ".  Processing with " + Module.TOTAL_MEMORY + " bits." : "")});var time = now();var result = ffmpeg_run(Module);var totalTime = now() - time;postMessage({"type" : "stdout","data" : "Finished processing (took " + totalTime + "ms)"});postMessage({"type" : "done","data" : result,"time" : totalTime});}};postMessage({"type" : "ready"});'], {
        type: 'application/javascript'
    }));

    var worker = new Worker(blob);
    URL.revokeObjectURL(blob);
    return worker;
}

var worker;

function convertStreams(videoBlob) {
    var aab;
    var buffersReady;
    var workerReady;
    var posted;

    var fileReader = new FileReader();
    fileReader.onload = function() {
        aab = this.result;
        postMessage();
    };
    fileReader.readAsArrayBuffer(videoBlob);

    if (!worker) {
        worker = processInWebWorker();
    }


    worker.onmessage = function(event) {

        var message = event.data;
        if (message.type == "ready") {
            workerReady = true;
            if (buffersReady)
                postMessage();
        } else if (message.type == "stdout") {
            
        } else if (message.type == "start") {
            
        } else if (message.type == "done") {
            
            var result = message.data[0];
            log(JSON.stringify(result));

            mp4_blob = new Blob([result.data], {
              type: 'video/mp4'
            });
        }
    };

    var postMessage = function() {
        posted = true;

        worker.postMessage({
            type: 'command',
            arguments: ['-i', videoFile, '-c:v', 'mpeg4', '-b:v', '64k', '-strict', 'experimental', 'output.mp4'],
            files: [
                {
                    data: new Uint8Array(aab),
                    name: videoFile
                }
            ]
        });
    };
}
*/
                    




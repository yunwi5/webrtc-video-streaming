const APP_ID = '115d94a569e24873bf31be3cd6fe382b';

// sessionStorage is cleared whenever user exits the website.
let uid = sessionStorage.getItem('uid');
if (!uid) {
    uid = String(Math.floor(Math.random() * 10000));
    sessionStorage.setItem('uid', uid);
}

let token = null;
let client;

let rtmClient;
let channel;

// room.html?room=1235
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');

if (!roomId) {
    // can redirect user to the lobby
    // but here we just set the roodId to 'main'
    roomId = 'main';
}

let displayName = sessionStorage.getItem('display_name');
if (!displayName) {
    window.location = 'lobby.html';
}

let localTracks = [];
let remoteUsers = {};

let localScreenTracks;
let sharingScreen = false;

// starting function (place inside react-context?)
const joinRoomInit = async () => {
    // Agora RTM SDK
    rtmClient = await AgoraRTM.createInstance(APP_ID);
    await rtmClient.login({ uid, token });

    channel = await rtmClient.createChannel(roomId);
    await channel.join();

    // add name to the rtmClient, so that member names can be displayed in the participants list
    await rtmClient.addOrUpdateLocalUserAttributes({ name: displayName });

    channel.on('MemberJoined', handleMemberJoin);
    channel.on('MemberLeft', handleMemberLeft);
    // Occurs when the local user receives a channel message
    channel.on('ChannelMessage', handleChannelMessage);

    // add all existing members to participants list on the left
    getParticipants();
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`);

    // Agora RTC SDK
    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    await client.join(APP_ID, roomId, token, uid);

    client.on('user-published', handleUserPublished);
    client.on('user-left', handleUserLeft);
};

// locally
// Joins stream optionally when the user clicks the 'Join Stream' button
const joinStream = async () => {
    // hide the join button when the user actually joins the stream
    joinBtn.style.display = 'none';
    document.getElementById('stream__actions').style.display = 'flex';

    // first obj is audio config, second obj is video config
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks(
        {},
        {
            encoderConfig: {
                width: { min: 640, ideal: 1920, max: 1920 },
                height: { min: 480, ideal: 1080, max: 1080 },
            },
        },
    );

    // unique video id
    let player = `<div class="video__container" id="user-container-${uid}">
                      <div class="video-player" id=user-${uid}></div>
                  </div>`;

    streamsContainer.insertAdjacentHTML('beforeend', player);
    document
        .getElementById(`user-container-${uid}`)
        .addEventListener('click', expandVideoFrame);

    localTracks[1].play(`user-${uid}`);
    // publish the audio track which is at index 0, video track which is at index 1
    // make sure the parameter is array
    await client.publish([localTracks[0], localTracks[1]]);
};

// locally
// called when the local user leaves the chat room
const leaveStream = async (e) => {
    e.preventDefault();
    joinBtn.style.display = 'block';
    document.getElementById('stream__actions').style.display = 'none';

    // loop through local tracks
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].stop();
        localTracks[i].close();
    }

    // unpublish audio at index 0 and video at index 1
    await client.unpublish([localTracks[0], localTracks[1]]);

    if (localScreenTracks) {
        await client.unpublish([localScreenTracks]);
    }

    document.getElementById(`user-container-${uid}`).remove();

    if (userIdInDisplayFrame === '') {
        displayFrame.style.display = null;

        for (let i = 0; i < videoFrames.length; i++) {
            videoFrames[i].style.height = '300px';
            videoFrames[i].style.width = '300px';
        }
    }

    channel.sendMessage({ text: JSON.stringify({ type: 'user_left', uid: uid }) });
};

// externally
// Called when the external user enters the chat room
let handleUserPublished = async (user, mediaType) => {
    // add new remote user to the list of remote users
    remoteUsers[user.uid] = user;

    await client.subscribe(user, mediaType);

    let player = document.getElementById(`user-container-${user.uid}`);
    // make sure this user does not exist in the DOM yet
    if (player === null) {
        player = `<div class="video__container" id="user-container-${user.uid}">
                <div class="video-player" id="user-${user.uid}"></div>
            </div>`;

        // add a player to the DOM
        streamsContainer.insertAdjacentHTML('beforeend', player);
        document
            .getElementById(`user-container-${uid}`)
            .addEventListener('click', expandVideoFrame);
    }

    if (displayFrame.style.display) {
        // query again (can set width&height after the element is added to the DOM!)
        // resize the videoFrame if there is a user in the main displayFrame.
        let videoFrame = document.getElementById(`user-container-${user.uid}`);
        videoFrame.style.height = '100px';
        videoFrame.style.width = '100px';
    }

    if (mediaType === 'video') {
        user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
};

// externally
// Called when the external user leaves the chat room
const handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    // remove left user element from the DOM
    const userContainer = document.getElementById(`user-container-${user.uid}`);
    if (userContainer) {
        userContainer.remove();
    }

    if (userIdInDisplayFrame === `user-container-${user.uid}`) {
        displayFrame.style.display = null;

        let videoFrames = document.getElementsByClassName('video__container');

        for (let i = 0; i < videoFrames.length; i++) {
            videoFrames[i].style.height = '300px';
            videoFrames[i].style.width = '300px';
        }
    }
};

const toggleMic = async (e) => {
    let button = e.currentTarget;
    // currently muted, unmute it
    // mic is at index 0
    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false);
        button.classList.add('active');
    } else {
        await localTracks[0].setMuted(true);
        button.classList.remove('active');
    }
};

const toggleCamera = async (e) => {
    let button = e.currentTarget;
    // currently muted, unmute it
    // video is at index 1
    if (localTracks[1].muted) {
        await localTracks[1].setMuted(false);
        button.classList.add('active');
    } else {
        await localTracks[1].setMuted(true);
        button.classList.remove('active');
    }
};

const toggleScreen = async (e) => {
    const containerId = `user-container-${uid}`;

    if (!sharingScreen) {
        sharingScreen = true;
        screenBtn.classList.add('active');
        cameraBtn.classList.remove('active');
        cameraBtn.style.display = 'none';

        localScreenTracks = await AgoraRTC.createScreenVideoTrack();

        document.getElementById(containerId).remove();
        displayFrame.style.display = 'block';

        let player = `<div class="video__container" id="user-container-${uid}">
                        <div class="video-player" id=user-${uid}></div>
                      </div>`;

        displayFrame.insertAdjacentHTML('beforeend', player);
        document.getElementById(containerId).addEventListener('click', expandVideoFrame);

        userIdInDisplayFrame = containerId;

        localScreenTracks.play(`user-${uid}`);

        // unpublish current video track
        // only unpublish video track at index 1, but still keep audio track at index 0
        await client.unpublish([localTracks[1]]);
        // publish localScreenTracks (only video track so no indexing here)
        await client.publish([localScreenTracks]);

        let videoFrames = document.getElementsByClassName('video__container');
        // make bottom user frames smaller (100px) when the main frame appears on the top
        for (let i = 0; i < videoFrames.length; i++) {
            if (videoFrames[i].id !== userIdInDisplayFrame) {
                videoFrames[i].style.height = `100px`;
                videoFrames[i].style.width = `100px`;
            }
        }
    } else {
        sharingScreen = false;
        screenBtn.classList.remove('active');
        cameraBtn.style.display = 'block';
        document.getElementById(containerId).remove();

        // unpublish screen sharing
        await client.unpublish([localScreenTracks]);

        switchToCamera();
    }
};

// switch from screen share mode to self camera mode.
const switchToCamera = async () => {
    // unique video id
    let player = `<div class="video__container" id="user-container-${uid}">
                      <div class="video-player" id=user-${uid}></div>
                  </div>`;

    // main frame (element defined in room.js)
    displayFrame.insertAdjacentHTML('beforeend', player);

    // initially mute camera and mic when turning back to camera mode.
    await localTracks[0].setMuted(true);
    await localTracks[1].setMuted(true);

    micBtn.classList.remove('active');
    screenBtn.classList.remove('active');

    localTracks[1].play(`user-${uid}`);
    // audio track is already published (but only muted), so do not pubilsh again
    // only publish video track at index 0
    await client.publish([localTracks[1]]);
};

const micBtn = document.getElementById('mic-btn');
const cameraBtn = document.getElementById('camera-btn');
const screenBtn = document.getElementById('screen-btn');
const leaveBtn = document.getElementById('leave-btn');
const joinBtn = document.getElementById('join-btn');

micBtn.addEventListener('click', toggleMic);
cameraBtn.addEventListener('click', toggleCamera);
screenBtn.addEventListener('click', toggleScreen);
joinBtn.addEventListener('click', joinStream);
leaveBtn.addEventListener('click', leaveStream);

joinRoomInit();

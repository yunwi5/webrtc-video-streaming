// scroll to the bottom when the user messages at the beginning
let messagesContainer = document.getElementById('messages');
messagesContainer.scrollTop = messagesContainer.scrollHeight;

// Toggle participants list on the left
const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');

// Toggle char area on the right
const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

let activeMemberContainer = false;

// Handle Participants sidebar UI
memberButton.addEventListener('click', () => {
    if (activeMemberContainer) {
        memberContainer.style.display = 'none';
    } else {
        memberContainer.style.display = 'block';
    }

    activeMemberContainer = !activeMemberContainer;
});

let activeChatContainer = false;

// Handle Chat sidebar UI
chatButton.addEventListener('click', () => {
    if (activeChatContainer) {
        chatContainer.style.display = 'none';
    } else {
        chatContainer.style.display = 'block';
    }

    activeChatContainer = !activeChatContainer;
});

// wrapper of expanded rectangle video frame
const displayFrame = document.getElementById('stream__box');
// wrapper of bottom list of video frames
const streamsContainer = document.getElementById('streams__container');
// bottom list of circular video frames
const videoFrames = document.getElementsByClassName('video__container');

// At the beginning, there is no member on the displayFrame (on the larger screen)
let userIdInDisplayFrame = null;

const expandVideoFrame = (e) => {
    let child = displayFrame.children[0];
    if (child) {
        // remove from the main frame
        // append back to bottom frame
        // streamsContainer is the parent of the videoPlayers
        streamsContainer.appendChild(child);
    }

    displayFrame.style.display = 'block';
    displayFrame.appendChild(e.currentTarget);
    userIdInDisplayFrame = e.currentTarget.id;

    // make bottom user frames smaller (100px) when the main frame appears on the top
    for (let i = 0; i < videoFrames.length; i++) {
        if (videoFrames[i].id !== userIdInDisplayFrame) {
            videoFrames[i].style.height = `100px`;
            videoFrames[i].style.width = `100px`;
        }
    }
};

const hideDisplayFrame = () => {
    userIdInDisplayFrame = null;
    displayFrame.style.display = null;

    let child = displayFrame.children[0];
    streamsContainer.appendChild(child);

    for (let i = 0; i < videoFrames.length; i++) {
        videoFrames[i].style.height = '300px';
        videoFrames[i].style.width = '300px';
    }
};

for (let i = 0; i < videoFrames.length; i++) {
    videoFrames[i].addEventListener('click', expandVideoFrame);
}

displayFrame.addEventListener('click', hideDisplayFrame);

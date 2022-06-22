// participants member list (list of member names)
const participantsList = document.getElementById('member__list');
const membersCount = document.getElementById('members__count');

const messageForm = document.getElementById('message__form');

/* 
Participant list section
*/
const handleMemberJoin = async (memberId) => {
    console.log('A new member has joined the room:', memberId);
    await addMemberToDom(memberId);
    // update member total whenever user joins or leave
    updateMemberTotal();

    let { name } = await rtmClient.getUserAttributesByKeys(memberId, ['name']);
    addBotMessageToDom(`Welcome to the room ${name}! 👋`);
};

const handleMemberLeft = async (memberId) => {
    await removeMemberFromDom(memberId);
    // update member total whenever user joins or leave
    updateMemberTotal();
};

// add chat box of the new user to the participants list
let addMemberToDom = async (memberId) => {
    let { name } = await rtmClient.getUserAttributesByKeys(memberId, ['name']);

    // let membersWrapper = document.getElementById('member__list');
    let memberItem = getParticipantBox(memberId, name);

    participantsList.insertAdjacentHTML('beforeend', memberItem);
};

// called when the channel receives the event when the member leaves the room
// item inside the participants list
const removeMemberFromDom = async (memberId) => {
    let memberWrapper = document.getElementById(`member__${memberId}__wrapper`);
    // this member already left the room, so cannot get name by calling rtmClient.getUserAttributesByKeys() function
    // instead access the dom chat element that contains username
    let name = memberWrapper.getElementsByClassName('member_name')[0].textContent;
    memberWrapper.remove();

    addBotMessageToDom(`${name} has left the room.`);
};

const updateMemberTotal = async () => {
    let members = await channel.getMembers();
    membersCount.textContent = members.length;
};

const getParticipants = async () => {
    // return members' ids
    let members = await channel.getMembers();
    updateMemberTotal();

    for (let i = 0; i < members.length; i++) {
        const memberId = members[i];
        addMemberToDom(memberId);
    }
};

// create chat box under participants list for a new user
const getParticipantBox = (memberId, name) => {
    return `<div class="member__wrapper" id="member__${memberId}__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">${name}</p>
            </div>`;
};

/* 
User chat message (chatting) section
*/
const handleChannelMessage = async (messageData, memberId) => {
    let data = JSON.parse(messageData.text);
    // console.log('Message:', data);
    if (data.type === 'chat') {
        addMessageToDom(data.displayName, data.message);
    } else if (data.type === 'user_left') {
        document.getElementById(`user-container-${data.uid}`).remove();
    }
};

const sendMessage = async (e) => {
    e.preventDefault();
    // messag is the 'name' of the form field
    let message = e.target.message.value;
    channel.sendMessage({
        text: JSON.stringify({ type: 'chat', message, displayName }),
    });
    addMessageToDom(displayName, message);

    // reset the form after sending the message
    e.target.reset();
};

const addMessageToDom = (name, message) => {
    const messagesList = document.getElementById('messages');

    // new message HTML element
    let newMessage = getUserChatbox(name, message);
    messagesList.insertAdjacentHTML('beforeend', newMessage);

    chatScrollDown();
};

const addBotMessageToDom = (botMessage) => {
    const messagesList = document.getElementById('messages');

    // new message HTML element
    let newMessage = getBotChatBox(botMessage);
    messagesList.insertAdjacentHTML('beforeend', newMessage);

    chatScrollDown();
};

// Scroll down to the current chat message so that
// user can see the most recent message without manually scrolling down
const chatScrollDown = () => {
    let lastMessage = document.querySelector('#messages .message__wrapper:last-child');
    if (lastMessage) lastMessage.scrollIntoView();
};

const getBotChatBox = (botMessage) => {
    return `
        <div class="message__wrapper">
            <div class="message__body__bot">
                <strong class="message__author__bot">🤖 Mumble Bot</strong>
                <p class="message__text__bot">${botMessage}</p>
            </div>
        </div>
    `;
};

const getUserChatbox = (name, message) => {
    return `
        <div class="message__wrapper">
            <div class="message__body">
                <strong class="message__author">${name}</strong>
                <p class="message__text">${message}</p>
            </div>
        </div>
    `;
};

// This function will trigger 'MemberLeft' event of the channel inside joinRoomInit() function
const leaveChannel = async () => {
    await channel.leave();
    await rtmClient.logout();
};

window.addEventListener('beforeunload', leaveChannel);

messageForm.addEventListener('submit', sendMessage);

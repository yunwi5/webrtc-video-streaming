const handleMemberJoin = async (memberId) => {
    console.log('A new member has joined the room:', memberId);
    addMemberToDom(memberId);
};

let addMemberToDom = async (memberId) => {
    let membersWrapper = document.getElementById('member__list');
    let memberItem = getChatBox(memberId);

    membersWrapper.insertAdjacentHTML('beforeend', memberItem);
};

const getChatBox = (memberId) => {
    return `<div class="member__wrapper" id="member__${memberId}__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">${memberId}</p>
            </div>`;
};

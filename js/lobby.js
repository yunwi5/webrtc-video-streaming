let form = document.getElementById('lobby__form');

let displayName = localStorage.getItem('display_name');
if (displayName) {
    form.name.value = displayName;
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const enteredName = e.target.name.value;
    // update username in the localStorage
    localStorage.setItem('display_name', enteredName);

    let inviteCode = e.target.room.value;
    if (!inviteCode) {
        inviteCode = String(Math.floor(Math.random() * 10000));
    }
    window.location = `room.html?room=${inviteCode}`;
});

let nav = 0;
let clicked = null;
let events = [];

async function fetchEvents() {
    const res = await fetch('/events');
    events = await res.json();
    load();
}


const calendar = document.getElementById('calendar');
const newEventModal = document.getElementById('newEventModal');
const deleteEventModal = document.getElementById('deleteEventModal');
const backDrop = document.getElementById('modalBackDrop');
const eventTitleInput = document.getElementById('eventInputTitle');
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


function openModal(date){
    clicked = date;


    const eventForDay = events.find(e => e.date === clicked);

    if(eventForDay){
        document.getElementById('eventText').innerText = eventForDay.title;
        deleteEventModal.style.display = 'block';

    }
    else{
        newEventModal.style.display = 'block'
    }

    backDrop.style.display = 'block'

}

function load(){
    const dt = new Date();

    if (nav !== 0){
        dt.setMonth(new Date().getMonth() + nav);
    }

    const day = dt.getDate();
    const month = dt.getMonth();
    const year = dt.getFullYear();

    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dateString = firstDayOfMonth.toLocaleDateString('en-GB', {
        weekday: 'long',
        month: 'numeric',
        year:'numeric',
        day: 'numeric',
    });

    const paddingDays = weekdays.indexOf(dateString.split(',')[0]);

    document.getElementById('monthDisplay').innerText = `${dt.toLocaleDateString('en-GB', {month: 'long'})} ${year}`;
    
    calendar.innerHTML = '';
    
    for(let i = 1; i <= paddingDays + daysInMonth; i++){
        const daySquare = document.createElement('div');
        daySquare.classList.add('day');

        const dayString = `${i - paddingDays}/${month + 1}/${year}`;

        if(i > paddingDays){
            daySquare.innerText = i - paddingDays;

            const eventForDay = events.find(e => e.date === dayString );

            
            daySquare.addEventListener('click', () => openModal(dayString));

            if (i - paddingDays === day && nav === 0 ){
                daySquare.id = 'currentDay';
            }

            if (eventForDay){
                const eventDiv = document.createElement('div');
                eventDiv.classList.add('event');
                eventDiv.innerText = eventForDay.title;
                daySquare.appendChild(eventDiv);
            }

        }
        else{
            daySquare.classList.add('padding');
        }

        
        calendar.appendChild(daySquare);

    }

}

function closeModal(){
    eventTitleInput.classList.remove('error');
    newEventModal.style.display = 'none';
    deleteEventModal.style.display = 'none';
    backDrop.style.display = 'none';
    eventTitleInput.value = '';
    clicked = null;
    load();
    
}

async function eventsToServer() {
    await fetch('/events', {
        method: 'POST',
        headers: {
            'Content-type':'application/json',
        },
        body: JSON.stringify(events),  
        
    });
    
}

async function saveEvent(){
    if (eventTitleInput.value){
        eventTitleInput.classList.remove('error');
        events.push({
            date: clicked,
            title: eventTitleInput.value,
        });
        await eventsToServer();
        closeModal();
    }
    else{
        eventTitleInput.classList.add('error');
    }
}

async function deleteEvent(){
    events = events.filter(e => e.date !== clicked);
    await eventsToServer();
    closeModal();
}

function initButtons(){
    document.getElementById('nextButton').addEventListener('click', () => {
        nav++;
        load();
    });

    document.getElementById('backButton').addEventListener('click', () => {
        nav--;
        load();
    });

    document.getElementById('saveButton').addEventListener('click', saveEvent);

    document.getElementById('cancelButton').addEventListener('click', closeModal);

    document.getElementById('deleteButton').addEventListener('click', deleteEvent);

    document.getElementById('closeButton').addEventListener('click', closeModal);

}

initButtons();
fetchEvents().then(() => load());
